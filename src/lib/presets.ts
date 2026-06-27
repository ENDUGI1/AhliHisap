/** Local presets so onboarding logging is fast. Indonesia-native defaults. */

export type FrequencyKey = "sering" | "sedang" | "irit";

export interface FrequencyPreset {
  key: FrequencyKey;
  label: string;
  hint: string;
  days_per_bottle: number;
}

/** Quick-pick: how fast a bottle runs out. Default = "sedang". */
export const FREQUENCY_PRESETS: FrequencyPreset[] = [
  { key: "sering", label: "Sering", hint: "± 10 hari/botol", days_per_bottle: 10 },
  { key: "sedang", label: "Sedang", hint: "± 14 hari/botol", days_per_bottle: 14 },
  { key: "irit", label: "Irit", hint: "± 21 hari/botol", days_per_bottle: 21 },
];

/** Common local liquid bottle prices/sizes to speed up entry. */
export const LIQUID_PRICE_PRESETS = [
  { label: "60 ml", bottle_ml: 60, bottle_price: 120_000 },
  { label: "100 ml", bottle_ml: 100, bottle_price: 150_000 },
  { label: "30 ml", bottle_ml: 30, bottle_price: 90_000 },
];

export const COIL_DEFAULTS = {
  pack_price: 50_000,
  units_per_pack: 5,
  change_weeks: 2,
};

/** Rough sessions/day estimate from frequency, used as the baseline seed. */
export const SESSIONS_BY_FREQUENCY: Record<FrequencyKey, number> = {
  sering: 8,
  sedang: 6,
  irit: 4,
};
