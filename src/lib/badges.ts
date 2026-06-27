/** A few simple badges. Momentum milestones, not data-heavy achievements. */

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  /** evaluated against rolling stats; returns true when earned */
  test: (s: BadgeStats) => boolean;
}

export interface BadgeStats {
  daysLogged: number; // distinct days with ≥1 session log
  belowBaselineDays: number; // distinct days finished under baseline
  totalSaved: number; // cumulative momentum rupiah
  loggedToday: boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first-log",
    name: "Langkah Pertama",
    desc: "Catat sesi pertamamu",
    test: (s) => s.daysLogged >= 1,
  },
  {
    id: "below-3",
    name: "Tiga Hari Lebih Ringan",
    desc: "3 hari di bawah baseline",
    test: (s) => s.belowBaselineDays >= 3,
  },
  {
    id: "week-streak",
    name: "Seminggu Nyatat",
    desc: "Nyatat di 7 hari berbeda",
    test: (s) => s.daysLogged >= 7,
  },
];

export function evaluateBadges(stats: BadgeStats): string[] {
  return BADGES.filter((b) => b.test(stats)).map((b) => b.id);
}
