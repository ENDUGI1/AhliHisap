import { LiquidLevel } from "@/components/LiquidLevel";
import { pct } from "@/lib/format";
import type { DashboardStats } from "@/db/stats";

/**
 * Hero = momentum, not money. Big number is sessions-today vs the usual line.
 * Aqua when below baseline (a win), gentle coral when above. Never harsh red.
 */
export function MomentumHero({
  stats,
  baseline,
}: {
  stats: DashboardStats;
  baseline: number;
}) {
  const scale = Math.max(baseline * 1.6, stats.sessionsToday + 1, 1);
  const fill = stats.sessionsToday / scale;
  const markerBottom = (baseline / scale) * 100;
  const tone = stats.belowBaseline ? "aqua" : stats.sessionsToday === baseline ? "aqua" : "coral";

  const deltaLabel = !stats.hasLoggedToday
    ? "belum nyatat"
    : stats.sessionsToday === baseline
      ? "pas di biasanya"
      : `${pct(stats.deltaPct)} ${stats.belowBaseline ? "di bawah" : "di atas"} biasanya`;

  return (
    <section className="hero" aria-label="Momentum hari ini">
      <LiquidLevel level={fill} height={232} tone={tone} calm>
        <div className="hero__marker" style={{ bottom: `${markerBottom}%` }}>
          <span className="hero__marker-label mono">biasanya {baseline}</span>
        </div>
        <div className="hero__content">
          <span className="hero__big mono">{stats.sessionsToday}</span>
          <span className="hero__unit">sesi hari ini</span>
          <span
            className={`hero__delta mono ${
              stats.belowBaseline ? "is-good" : stats.sessionsToday > baseline ? "is-warn" : ""
            }`}
          >
            {deltaLabel}
          </span>
        </div>
      </LiquidLevel>
    </section>
  );
}
