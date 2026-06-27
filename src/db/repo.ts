import { db, uid, PROFILE_ID } from "./db";
import type { Mode, Profile, Product } from "./types";
import {
  baselineCostDay,
  baselineMlDay,
  costPerSession,
  type CoilInput,
  type LiquidInput,
} from "@/lib/formula";

export interface OnboardingDraft {
  uses: { vape: boolean; cigarette: boolean };
  liquid: LiquidInput & { name?: string };
  coil?: (CoilInput & { name?: string }) | null;
  baseline_sessions_day: number;
}

/** Commit onboarding: creates products + the profile row with snapshot baseline. */
export async function completeOnboarding(draft: OnboardingDraft): Promise<void> {
  const now = Date.now();
  const liquidId = uid();

  const products: Product[] = [
    {
      id: liquidId,
      type: "liquid",
      name: draft.liquid.name?.trim() || "Liquid",
      bottle_price: draft.liquid.bottle_price,
      bottle_ml: draft.liquid.bottle_ml,
      days_per_bottle: draft.liquid.days_per_bottle,
      created_at: now,
    },
  ];

  if (draft.coil) {
    products.push({
      id: uid(),
      type: "coil",
      name: draft.coil.name?.trim() || "Coil",
      pack_price: draft.coil.pack_price,
      units_per_pack: draft.coil.units_per_pack,
      change_weeks: draft.coil.change_weeks,
      created_at: now,
    });
  }

  const cost_day = baselineCostDay(draft.liquid, draft.coil ?? null);

  const profile: Profile = {
    id: PROFILE_ID,
    mode: "reduce", // set silently, never asked
    unit: "ml",
    uses: draft.uses,
    baseline_sessions_day: draft.baseline_sessions_day,
    baseline_ml_day: baselineMlDay(draft.liquid),
    baseline_cost_day: cost_day,
    baseline_corrected_at: null,
    onboarded: true,
    created_at: now,
  };

  await db.transaction("rw", db.products, db.profile, async () => {
    await db.products.bulkPut(products);
    await db.profile.put(profile);
  });
}

export async function getPrimaryLiquid(): Promise<Product | undefined> {
  return db.products.where("type").equals("liquid").first();
}

/** 1-tap session log. Snapshots the price so future price changes don't rewrite history. */
export async function logSession(): Promise<void> {
  const profile = await db.profile.get(PROFILE_ID);
  const liquid = await getPrimaryLiquid();
  if (!profile || !liquid) return;
  const cps = costPerSession(profile.baseline_cost_day, profile.baseline_sessions_day);
  await db.sessions.add({
    id: uid(),
    timestamp: Date.now(),
    product_id: liquid.id,
    cost_per_session_snapshot: cps,
  });
}

/** Undo the most recent session (gentle correction for mis-taps). */
export async function undoLastSession(): Promise<void> {
  const last = await db.sessions.orderBy("timestamp").last();
  if (last) await db.sessions.delete(last.id);
}

/** Record a bottle change/finish — the accuracy calibrator. */
export async function logBottleEvent(): Promise<void> {
  const liquid = await getPrimaryLiquid();
  if (!liquid) return;
  await db.bottleEvents.add({
    id: uid(),
    timestamp: Date.now(),
    product_id: liquid.id,
    bottle_ml_snapshot: liquid.bottle_ml ?? 0,
    bottle_price_snapshot: liquid.bottle_price ?? 0,
  });
}

/** Apply the 7-day baseline correction the user accepted. */
export async function correctBaseline(
  actualCostDay: number,
  actualMlDay: number,
): Promise<void> {
  const profile = await db.profile.get(PROFILE_ID);
  if (!profile) return;
  await db.profile.update(PROFILE_ID, {
    baseline_cost_day: actualCostDay,
    baseline_ml_day: actualMlDay,
    baseline_corrected_at: Date.now(),
  });
}

export async function setMode(mode: Mode): Promise<void> {
  await db.profile.update(PROFILE_ID, { mode });
}

export async function syncBadges(earnedIds: string[]): Promise<string[]> {
  const existing = new Set((await db.badges.toArray()).map((b) => b.id));
  const fresh = earnedIds.filter((id) => !existing.has(id));
  if (fresh.length) {
    await db.badges.bulkPut(fresh.map((id) => ({ id, earned_at: Date.now() })));
  }
  return fresh;
}

/** Wipe everything (for the "mulai ulang" escape hatch). */
export async function resetAll(): Promise<void> {
  await db.transaction(
    "rw",
    [db.profile, db.products, db.sessions, db.bottleEvents, db.badges],
    async () => {
      await Promise.all([
        db.profile.clear(),
        db.products.clear(),
        db.sessions.clear(),
        db.bottleEvents.clear(),
        db.badges.clear(),
      ]);
    },
  );
}
