import { db, uid, PROFILE_ID } from "./db";
import type { CheckinLevel, Mode, Profile, Product } from "./types";
import { dayKey } from "@/lib/format";
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

/** Set today's qualitative check-in. Tapping the active level again clears it. */
export async function setCheckin(level: CheckinLevel): Promise<void> {
  const day = dayKey(Date.now());
  const existing = await db.checkins.get(day);
  if (existing && existing.level === level) {
    await db.checkins.delete(day);
    return;
  }
  await db.checkins.put({ day, level, timestamp: Date.now() });
}

/** Manual baseline edit from Settings — recomputes cost/ml from liquid + coil. */
export async function updateBaselineManual(input: {
  sessions_day: number;
  bottle_price: number;
  bottle_ml: number;
  days_per_bottle: number;
}): Promise<void> {
  const profile = await db.profile.get(PROFILE_ID);
  if (!profile) return;
  const liquid = await getPrimaryLiquid();
  const coilProd = await db.products.where("type").equals("coil").first();

  const liquidInput = {
    bottle_price: input.bottle_price,
    bottle_ml: input.bottle_ml,
    days_per_bottle: input.days_per_bottle,
  };
  const coilInput = coilProd
    ? {
        pack_price: coilProd.pack_price ?? 0,
        units_per_pack: coilProd.units_per_pack ?? 0,
        change_weeks: coilProd.change_weeks ?? 0,
      }
    : null;

  await db.transaction("rw", db.products, db.profile, async () => {
    if (liquid) await db.products.update(liquid.id, liquidInput);
    await db.profile.update(PROFILE_ID, {
      baseline_sessions_day: input.sessions_day,
      baseline_cost_day: baselineCostDay(liquidInput, coilInput),
      baseline_ml_day: baselineMlDay(liquidInput),
      baseline_corrected_at: Date.now(),
    });
  });
}

export async function syncBadges(earnedIds: string[]): Promise<string[]> {
  const existing = new Set((await db.badges.toArray()).map((b) => b.id));
  const fresh = earnedIds.filter((id) => !existing.has(id));
  if (fresh.length) {
    await db.badges.bulkPut(fresh.map((id) => ({ id, earned_at: Date.now() })));
  }
  return fresh;
}

export interface ExportBundle {
  app: "ahlihisap";
  version: 2;
  exported_at: number;
  profile: unknown;
  products: unknown[];
  sessions: unknown[];
  bottleEvents: unknown[];
  badges: unknown[];
  checkins: unknown[];
}

/** Snapshot every table — the local-first backup. */
export async function exportAll(): Promise<ExportBundle> {
  const [profile, products, sessions, bottleEvents, badges, checkins] =
    await Promise.all([
      db.profile.get(PROFILE_ID),
      db.products.toArray(),
      db.sessions.toArray(),
      db.bottleEvents.toArray(),
      db.badges.toArray(),
      db.checkins.toArray(),
    ]);
  return {
    app: "ahlihisap",
    version: 2,
    exported_at: Date.now(),
    profile: profile ?? null,
    products,
    sessions,
    bottleEvents,
    badges,
    checkins,
  };
}

/** Restore from a backup bundle. Replaces all current data. */
export async function importAll(bundle: ExportBundle): Promise<void> {
  if (!bundle || bundle.app !== "ahlihisap" || !bundle.profile) {
    throw new Error("File cadangan tidak dikenali.");
  }
  await db.transaction(
    "rw",
    [db.profile, db.products, db.sessions, db.bottleEvents, db.badges, db.checkins],
    async () => {
      await Promise.all([
        db.profile.clear(),
        db.products.clear(),
        db.sessions.clear(),
        db.bottleEvents.clear(),
        db.badges.clear(),
        db.checkins.clear(),
      ]);
      await db.profile.put(bundle.profile as never);
      await db.products.bulkPut((bundle.products ?? []) as never[]);
      await db.sessions.bulkPut((bundle.sessions ?? []) as never[]);
      await db.bottleEvents.bulkPut((bundle.bottleEvents ?? []) as never[]);
      await db.badges.bulkPut((bundle.badges ?? []) as never[]);
      await db.checkins.bulkPut((bundle.checkins ?? []) as never[]);
    },
  );
}

/** Wipe everything (for the "mulai ulang" escape hatch). */
export async function resetAll(): Promise<void> {
  await db.transaction(
    "rw",
    [db.profile, db.products, db.sessions, db.bottleEvents, db.badges, db.checkins],
    async () => {
      await Promise.all([
        db.profile.clear(),
        db.products.clear(),
        db.sessions.clear(),
        db.bottleEvents.clear(),
        db.badges.clear(),
        db.checkins.clear(),
      ]);
    },
  );
}
