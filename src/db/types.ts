/**
 * Data model — mirrors the build brief.
 * Designed so a future move to Supabase/Postgres is a sync layer, not a rewrite:
 * string UUID ids, ISO-string-friendly timestamps (stored as epoch ms here),
 * and every log snapshots the price at the moment it happened.
 */

export type Mode = "reduce" | "quit";
export type ProductType = "liquid" | "coil" | "cigarette";

export interface Profile {
  id: string; // single-row 'me' for v1
  mode: Mode; // default 'reduce'
  unit: "ml"; // vape measured in ml, never puffs
  uses: { vape: boolean; cigarette: boolean };

  baseline_sessions_day: number; // estimated sessions/day (e.g. 6)
  baseline_ml_day: number; // bottle_ml / days_per_bottle
  baseline_cost_day: number; // liquid/day + coil/day (snapshot at onboarding)

  // kept so baseline can be recomputed/corrected later
  baseline_corrected_at: number | null;
  onboarded: boolean;
  created_at: number;
}

export interface Product {
  id: string;
  type: ProductType;
  name: string;

  // liquid
  bottle_price?: number;
  bottle_ml?: number;
  days_per_bottle?: number;

  // coil — background cost, NOT logged daily
  pack_price?: number;
  units_per_pack?: number;
  change_weeks?: number;

  archived?: boolean;
  created_at: number;
}

/** Lightweight 1-tap daily logging. Drives MOMENTUM. Fuzzy by design. */
export interface SessionLog {
  id: string;
  timestamp: number;
  product_id: string;
  cost_per_session_snapshot: number; // price locked at log time
}

/** The accuracy CALIBRATOR. Recorded when a bottle is changed/finished. */
export interface BottleEvent {
  id: string;
  timestamp: number;
  product_id: string;
  bottle_ml_snapshot: number;
  bottle_price_snapshot: number;
}

export interface BadgeRecord {
  id: string; // badge key
  earned_at: number;
}
