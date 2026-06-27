/** Pure aggregation: raw logs -> dashboard numbers. No I/O, easy to reason about. */
import type { Profile, SessionLog, BottleEvent, Checkin, CheckinLevel } from "./types";
import { dayKey, shortDay } from "@/lib/format";
import { checkinSessions } from "@/lib/checkin";
import {
  costPerSession,
  savedToday,
  deltaPct,
  daysBetween,
  actualMlDay,
  actualCostDay,
} from "@/lib/formula";

export interface TrendDay {
  key: string;
  label: string;
  count: number;
  isToday: boolean;
  hasInput: boolean; // false = not logged (distinct from a recorded zero)
}

export interface DashboardStats {
  sessionsToday: number;
  costPerSession: number;
  savedToday: number; // momentum proxy (can be negative)
  deltaPct: number; // sessions vs baseline, signed
  belowBaseline: boolean;
  totalSaved: number; // cumulative, positive-only (the piggy bank)
  trend: TrendDay[]; // last 7 days, oldest -> newest
  daysLogged: number;
  belowBaselineDays: number;
  hasLoggedToday: boolean;
  todayCheckin: CheckinLevel | null; // set => momentum came from a check-in, not taps
}

function countByDay(sessions: SessionLog[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of sessions) {
    const k = dayKey(s.timestamp);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function computeDashboard(
  profile: Profile,
  sessions: SessionLog[],
  checkins: Checkin[],
  now = Date.now(),
): DashboardStats {
  const baseline = profile.baseline_sessions_day;
  const cps = costPerSession(profile.baseline_cost_day, baseline);
  const rawByDay = countByDay(sessions);
  const checkinByDay = new Map(checkins.map((c) => [c.day, c.level]));
  const todayKey = dayKey(now);

  // a check-in overrides the raw tap count for that day's momentum
  const effective = (k: string): number => {
    const lvl = checkinByDay.get(k);
    if (lvl) return checkinSessions(lvl, baseline);
    return rawByDay.get(k) ?? 0;
  };
  const hasInput = (k: string): boolean =>
    checkinByDay.has(k) || (rawByDay.get(k) ?? 0) > 0;

  const daysWithInput = new Set<string>([...rawByDay.keys(), ...checkinByDay.keys()]);
  const sessionsToday = effective(todayKey);

  // 7-day trend window
  const trend: TrendDay[] = [];
  const DAY = 86_400_000;
  for (let i = 6; i >= 0; i--) {
    const ts = now - i * DAY;
    const k = dayKey(ts);
    trend.push({
      key: k,
      label: shortDay(ts),
      count: effective(k),
      isToday: k === todayKey,
      hasInput: hasInput(k),
    });
  }

  // cumulative saved = positive contributions only (non-judgmental piggy bank)
  let totalSaved = 0;
  let belowBaselineDays = 0;
  for (const k of daysWithInput) {
    const s = savedToday(baseline, effective(k), cps);
    if (s > 0) {
      totalSaved += s;
      belowBaselineDays++;
    }
  }

  return {
    sessionsToday,
    costPerSession: cps,
    savedToday: savedToday(baseline, sessionsToday, cps),
    deltaPct: deltaPct(sessionsToday, baseline),
    belowBaseline: sessionsToday < baseline,
    totalSaved,
    trend,
    daysLogged: daysWithInput.size,
    belowBaselineDays,
    hasLoggedToday: hasInput(todayKey),
    todayCheckin: checkinByDay.get(todayKey) ?? null,
  };
}

export interface BaselineSuggestion {
  ready: boolean;
  actualMlDay: number;
  actualCostDay: number;
  spanDays: number;
}

/**
 * After ≥2 bottle events spanning ≥7 days, derive the REAL ml/day & cost/day
 * so we can offer to correct the onboarding guess.
 */
export function baselineSuggestion(
  events: BottleEvent[],
  now = Date.now(),
): BaselineSuggestion | null {
  if (events.length < 2) return null;
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span = daysBetween(first.timestamp, last.timestamp);
  if (span < 7) return { ready: false, actualMlDay: 0, actualCostDay: 0, spanDays: span };

  // sum the bottles CONSUMED between first and last event (exclude the first marker)
  let mlConsumed = 0;
  let costConsumed = 0;
  for (let i = 1; i < sorted.length; i++) {
    mlConsumed += sorted[i].bottle_ml_snapshot;
    costConsumed += sorted[i].bottle_price_snapshot;
  }
  void now;
  return {
    ready: true,
    actualMlDay: actualMlDay(mlConsumed, span),
    actualCostDay: actualCostDay(costConsumed, span),
    spanDays: span,
  };
}
