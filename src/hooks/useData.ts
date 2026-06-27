import { useLiveQuery } from "dexie-react-hooks";
import { db, PROFILE_ID } from "@/db/db";
import { computeDashboard, baselineSuggestion } from "@/db/stats";
import type { Profile } from "@/db/types";

/** undefined = still loading; null = no profile yet (needs onboarding). */
export function useProfile(): Profile | null | undefined {
  return useLiveQuery(async () => {
    const p = await db.profile.get(PROFILE_ID);
    return p ?? null;
  }, []);
}

export function useDashboard(profile: Profile | null | undefined) {
  return useLiveQuery(async () => {
    if (!profile) return undefined;
    const [sessions, checkins] = await Promise.all([
      db.sessions.toArray(),
      db.checkins.toArray(),
    ]);
    return computeDashboard(profile, sessions, checkins);
  }, [profile]);
}

export function useBaselineSuggestion(profile: Profile | null | undefined) {
  return useLiveQuery(async () => {
    if (!profile || profile.baseline_corrected_at) return null;
    const events = await db.bottleEvents.toArray();
    return baselineSuggestion(events);
  }, [profile]);
}

export function useEarnedBadges() {
  return useLiveQuery(async () => {
    const rows = await db.badges.toArray();
    return new Set(rows.map((b) => b.id));
  }, []);
}
