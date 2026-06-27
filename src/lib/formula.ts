/**
 * Pure money/momentum math. No I/O — fully unit-testable.
 * Every formula here matches §4 of the build brief.
 */

const DAY_MS = 86_400_000;

export interface LiquidInput {
  bottle_price: number;
  bottle_ml: number;
  days_per_bottle: number;
}

export interface CoilInput {
  pack_price: number;
  units_per_pack: number;
  change_weeks: number;
}

export const costPerMl = ({ bottle_price, bottle_ml }: LiquidInput): number =>
  bottle_ml > 0 ? bottle_price / bottle_ml : 0;

export const liquidCostDay = ({
  bottle_price,
  days_per_bottle,
}: LiquidInput): number => (days_per_bottle > 0 ? bottle_price / days_per_bottle : 0);

/** Coil is a background cost, amortised per day — never logged per session. */
export const coilCostDay = ({
  pack_price,
  units_per_pack,
  change_weeks,
}: CoilInput): number => {
  const denom = units_per_pack * change_weeks * 7;
  return denom > 0 ? pack_price / denom : 0;
};

export const baselineCostDay = (
  liquid: LiquidInput,
  coil?: CoilInput | null,
): number => liquidCostDay(liquid) + (coil ? coilCostDay(coil) : 0);

export const baselineMlDay = ({ bottle_ml, days_per_bottle }: LiquidInput): number =>
  days_per_bottle > 0 ? bottle_ml / days_per_bottle : 0;

export const costPerSession = (
  baseline_cost_day: number,
  baseline_sessions_day: number,
): number =>
  baseline_sessions_day > 0 ? baseline_cost_day / baseline_sessions_day : 0;

/**
 * Daily momentum proxy. Positive = under baseline (money "saved" today).
 * Intentionally imprecise — it's a feeling, not accounting.
 */
export const savedToday = (
  baseline_sessions_day: number,
  sessions_today: number,
  cost_per_session: number,
): number => (baseline_sessions_day - sessions_today) * cost_per_session;

/** Negative = below baseline (good), positive = above. */
export const deltaPct = (
  sessions_today: number,
  baseline_sessions_day: number,
): number =>
  baseline_sessions_day > 0
    ? (sessions_today - baseline_sessions_day) / baseline_sessions_day
    : 0;

/* ---- accuracy track: derived from bottle_event intervals ---- */

export const daysBetween = (fromMs: number, toMs: number): number =>
  Math.max((toMs - fromMs) / DAY_MS, 0);

export const actualMlDay = (bottle_ml: number, days_since: number): number =>
  days_since > 0 ? bottle_ml / days_since : 0;

export const actualCostDay = (bottle_price: number, days_since: number): number =>
  days_since > 0 ? bottle_price / days_since : 0;

/** Round currency to the nearest rupiah (no fractional rupiah in display). */
export const rpRound = (n: number): number => Math.round(n);
