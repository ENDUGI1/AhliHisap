import { describe, it, expect } from "vitest";
import {
  costPerMl,
  liquidCostDay,
  coilCostDay,
  baselineCostDay,
  baselineMlDay,
  costPerSession,
  savedToday,
  deltaPct,
  actualMlDay,
  actualCostDay,
  daysBetween,
} from "./formula";

const liquid = { bottle_price: 120_000, bottle_ml: 60, days_per_bottle: 14 };
const coil = { pack_price: 50_000, units_per_pack: 5, change_weeks: 2 };

describe("liquid math", () => {
  it("cost per ml", () => {
    expect(costPerMl(liquid)).toBeCloseTo(2000);
  });
  it("liquid cost per day", () => {
    expect(liquidCostDay(liquid)).toBeCloseTo(120_000 / 14);
  });
  it("baseline ml per day", () => {
    expect(baselineMlDay(liquid)).toBeCloseTo(60 / 14);
  });
});

describe("coil math (background cost)", () => {
  it("amortises over units x weeks x 7", () => {
    // 50000 / (5 * 2 * 7) = 50000 / 70
    expect(coilCostDay(coil)).toBeCloseTo(50_000 / 70);
  });
  it("baseline cost = liquid/day + coil/day", () => {
    expect(baselineCostDay(liquid, coil)).toBeCloseTo(
      120_000 / 14 + 50_000 / 70,
    );
  });
  it("works without a coil", () => {
    expect(baselineCostDay(liquid, null)).toBeCloseTo(120_000 / 14);
  });
});

describe("momentum proxy", () => {
  const cpd = baselineCostDay(liquid, coil);
  const cps = costPerSession(cpd, 6);

  it("cost per session splits the daily cost", () => {
    expect(cps).toBeCloseTo(cpd / 6);
  });
  it("under baseline => positive saved", () => {
    expect(savedToday(6, 4, cps)).toBeCloseTo(2 * cps);
  });
  it("at baseline => zero saved", () => {
    expect(savedToday(6, 6, cps)).toBeCloseTo(0);
  });
  it("over baseline => negative saved (not 'failure', just math)", () => {
    expect(savedToday(6, 8, cps)).toBeCloseTo(-2 * cps);
  });
  it("delta pct sign: below baseline is negative", () => {
    expect(deltaPct(3, 6)).toBeCloseTo(-0.5);
    expect(deltaPct(9, 6)).toBeCloseTo(0.5);
  });
});

describe("accuracy track (bottle events)", () => {
  it("days between two timestamps", () => {
    const a = Date.UTC(2026, 0, 1);
    const b = Date.UTC(2026, 0, 11);
    expect(daysBetween(a, b)).toBeCloseTo(10);
  });
  it("actual ml/day from a real bottle interval", () => {
    expect(actualMlDay(60, 10)).toBeCloseTo(6);
  });
  it("actual cost/day from a real bottle interval", () => {
    expect(actualCostDay(120_000, 10)).toBeCloseTo(12_000);
  });
});

describe("guards: never divide by zero", () => {
  it("zero ml/days/sessions return 0, not NaN/Infinity", () => {
    expect(costPerMl({ bottle_price: 1, bottle_ml: 0, days_per_bottle: 0 })).toBe(0);
    expect(liquidCostDay({ bottle_price: 1, bottle_ml: 1, days_per_bottle: 0 })).toBe(0);
    expect(costPerSession(1000, 0)).toBe(0);
    expect(actualMlDay(60, 0)).toBe(0);
  });
});
