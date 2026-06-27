import type { CheckinLevel } from "@/db/types";

/** Daily check-in levels — a once-a-day momentum input that needs no counting. */
export const CHECKIN_LEVELS: {
  key: CheckinLevel;
  label: string;
  factor: number; // multiplier on baseline sessions/day
}[] = [
  { key: "bersih", label: "Bersih", factor: 0 },
  { key: "ringan", label: "Ringan", factor: 0.6 },
  { key: "biasa", label: "Biasa", factor: 1 },
  { key: "banyak", label: "Banyak", factor: 1.4 },
];

const FACTOR: Record<CheckinLevel, number> = Object.fromEntries(
  CHECKIN_LEVELS.map((l) => [l.key, l.factor]),
) as Record<CheckinLevel, number>;

/** Map a qualitative level to an effective session count for the day. */
export function checkinSessions(level: CheckinLevel, baseline: number): number {
  if (level === "bersih") return 0;
  return Math.max(1, Math.round(baseline * FACTOR[level]));
}

export const checkinLabel = (level: CheckinLevel): string =>
  CHECKIN_LEVELS.find((l) => l.key === level)?.label ?? level;
