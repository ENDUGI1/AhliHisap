import { describe, it, expect } from "vitest";
import { computeDashboard, baselineSuggestion } from "./stats";
import type { Profile, SessionLog, BottleEvent, Checkin } from "./types";
import { dayKey } from "@/lib/format";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 5, 27, 6, 0, 0); // fixed reference

const profile: Profile = {
  id: "me",
  mode: "reduce",
  unit: "ml",
  uses: { vape: true, cigarette: false },
  baseline_sessions_day: 6,
  baseline_ml_day: 60 / 14,
  baseline_cost_day: 120_000 / 14, // ~8571.43
  baseline_corrected_at: null,
  onboarded: true,
  created_at: NOW,
};

const cps = profile.baseline_cost_day / profile.baseline_sessions_day; // ~1428.57

const session = (ts: number): SessionLog => ({
  id: `s-${ts}-${Math.random()}`,
  timestamp: ts,
  product_id: "p",
  cost_per_session_snapshot: cps,
});
const checkin = (ts: number, level: Checkin["level"]): Checkin => ({
  day: dayKey(ts),
  level,
  timestamp: ts,
});

describe("computeDashboard — empty", () => {
  const s = computeDashboard(profile, [], [], NOW);
  it("clean slate", () => {
    expect(s.sessionsToday).toBe(0);
    expect(s.hasLoggedToday).toBe(false);
    expect(s.totalSaved).toBe(0);
    expect(s.daysLogged).toBe(0);
    expect(s.todayCheckin).toBeNull();
  });
  it("always renders a 7-day window, today last", () => {
    expect(s.trend).toHaveLength(7);
    expect(s.trend[6].isToday).toBe(true);
    expect(s.trend.every((d) => !d.hasInput)).toBe(true);
  });
});

describe("computeDashboard — per-session taps", () => {
  const sessions = [session(NOW), session(NOW), session(NOW)]; // 3 today
  const s = computeDashboard(profile, sessions, [], NOW);
  it("counts today and flags below baseline", () => {
    expect(s.sessionsToday).toBe(3);
    expect(s.belowBaseline).toBe(true);
    expect(s.hasLoggedToday).toBe(true);
  });
  it("money saved = (baseline - today) * cps, positive only", () => {
    expect(s.savedToday).toBeCloseTo(3 * cps);
    expect(s.totalSaved).toBeCloseTo(3 * cps);
    expect(s.belowBaselineDays).toBe(1);
  });
  it("trend marks today with the count and input", () => {
    expect(s.trend[6].count).toBe(3);
    expect(s.trend[6].hasInput).toBe(true);
  });
});

describe("computeDashboard — check-in overrides raw count", () => {
  it("banyak pushes above baseline (coral path)", () => {
    const s = computeDashboard(profile, [session(NOW)], [checkin(NOW, "banyak")], NOW);
    expect(s.sessionsToday).toBe(8); // checkin wins over the single tap
    expect(s.belowBaseline).toBe(false);
    expect(s.todayCheckin).toBe("banyak");
    expect(s.totalSaved).toBe(0); // above baseline contributes nothing
  });
  it("bersih is a recorded clean day: logged, zero, and saving", () => {
    const s = computeDashboard(profile, [], [checkin(NOW, "bersih")], NOW);
    expect(s.sessionsToday).toBe(0);
    expect(s.hasLoggedToday).toBe(true);
    expect(s.trend[6].hasInput).toBe(true);
    expect(s.trend[6].count).toBe(0);
    expect(s.savedToday).toBeCloseTo(6 * cps);
    expect(s.belowBaselineDays).toBe(1);
  });
});

describe("computeDashboard — multi-day accumulation", () => {
  const sessions = [
    session(NOW - 2 * DAY), // 2 days ago: 1 session
    session(NOW), // today
    session(NOW),
  ];
  const checkins = [checkin(NOW - 4 * DAY, "bersih")]; // clean day 4 days ago
  const s = computeDashboard(profile, sessions, checkins, NOW);
  it("counts every day with input", () => {
    expect(s.daysLogged).toBe(3); // 2-ago, 4-ago, today
  });
  it("sums saved across below-baseline days", () => {
    // day -2: 1 sess -> 5*cps ; day -4 bersih: 6*cps ; today: 2 sess -> 4*cps
    expect(s.totalSaved).toBeCloseTo((5 + 6 + 4) * cps);
    expect(s.belowBaselineDays).toBe(3);
  });
});

describe("baselineSuggestion — accuracy track", () => {
  const ev = (ts: number, ml: number, price: number): BottleEvent => ({
    id: `b-${ts}`,
    timestamp: ts,
    product_id: "p",
    bottle_ml_snapshot: ml,
    bottle_price_snapshot: price,
  });
  it("needs at least two events", () => {
    expect(baselineSuggestion([ev(NOW, 60, 120_000)], NOW)).toBeNull();
  });
  it("not ready before 7 days of span", () => {
    const r = baselineSuggestion([ev(NOW - 3 * DAY, 60, 120_000), ev(NOW, 60, 120_000)], NOW);
    expect(r?.ready).toBe(false);
  });
  it("derives real ml/day and cost/day over the span", () => {
    // first marker at -10d, one bottle (60ml/120k) consumed by now
    const r = baselineSuggestion(
      [ev(NOW - 10 * DAY, 60, 120_000), ev(NOW, 60, 120_000)],
      NOW,
    );
    expect(r?.ready).toBe(true);
    expect(r?.spanDays).toBeCloseTo(10);
    expect(r?.actualMlDay).toBeCloseTo(6); // 60ml / 10 days
    expect(r?.actualCostDay).toBeCloseTo(12_000); // 120k / 10 days
  });
});
