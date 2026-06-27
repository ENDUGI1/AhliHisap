import Dexie, { type Table } from "dexie";
import type {
  Profile,
  Product,
  SessionLog,
  BottleEvent,
  BadgeRecord,
  Checkin,
} from "./types";

/**
 * Local-first store (Tahap 0). No backend, no login, no cost.
 * Schema mirrors the eventual Postgres shape so syncing later = a new layer.
 */
class AhliHisapDB extends Dexie {
  profile!: Table<Profile, string>;
  products!: Table<Product, string>;
  sessions!: Table<SessionLog, string>;
  bottleEvents!: Table<BottleEvent, string>;
  badges!: Table<BadgeRecord, string>;
  checkins!: Table<Checkin, string>;

  constructor() {
    super("ahlihisap");
    this.version(1).stores({
      profile: "id",
      products: "id, type, archived",
      sessions: "id, timestamp, product_id",
      bottleEvents: "id, timestamp, product_id",
      badges: "id, earned_at",
    });
    // v2: daily check-in — qualitative momentum input, one row per day
    this.version(2).stores({
      checkins: "day, timestamp",
    });
  }
}

export const db = new AhliHisapDB();

export const PROFILE_ID = "me";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
