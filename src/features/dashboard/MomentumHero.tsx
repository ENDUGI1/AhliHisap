import { motion, useReducedMotion } from "motion/react";
import { LiquidLevel } from "@/components/LiquidLevel";
import { pct } from "@/lib/format";
import { checkinLabel } from "@/lib/checkin";
import type { CheckinLevel } from "@/db/types";
import type { DashboardStats } from "@/db/stats";

/**
 * Hero = momentum, not money. Big number is sessions-today vs the usual line.
 * Aqua when at/below baseline (a win), gentle coral when above. Never harsh red.
 */
export function MomentumHero({
  stats,
  baseline,
  checkin,
}: {
  stats: DashboardStats;
  baseline: number;
  checkin: CheckinLevel | null;
}) {
  const reduce = useReducedMotion();
  const scale = Math.max(baseline * 1.6, stats.sessionsToday + 1, 1);
  const fill = stats.sessionsToday / scale;
  const markerBottom = (baseline / scale) * 100;
  const tone = stats.sessionsToday > baseline ? "coral" : "aqua";

  // "breath reward": a calm pulse behind the number, only on a real reduction win
  const winning = stats.hasLoggedToday && stats.sessionsToday < baseline;

  const deltaLabel = !stats.hasLoggedToday
    ? "belum nyatat"
    : stats.sessionsToday === baseline
      ? "pas di biasanya"
      : `${pct(stats.deltaPct)} ${stats.belowBaseline ? "di bawah" : "di atas"} biasanya`;

  return (
    <section className="hero" aria-label="Momentum hari ini">
      <LiquidLevel level={fill} height={232} tone={tone} calm>
        {winning && (
          <motion.span
            className="hero__breath"
            aria-hidden
            initial={false}
            animate={
              reduce
                ? { opacity: 0.5, scale: 1 }
                : { opacity: [0.35, 0.7, 0.35], scale: [1, 1.14, 1] }
            }
            transition={
              reduce
                ? undefined
                : { duration: 4.6, ease: "easeInOut", repeat: Infinity }
            }
          />
        )}
        <div className="hero__marker" style={{ bottom: `${markerBottom}%` }}>
          <span className="hero__marker-label mono">biasanya {baseline}</span>
        </div>
        <div className="hero__content">
          <motion.span
            key={stats.sessionsToday}
            className="hero__big mono"
            initial={reduce ? false : { scale: 0.7, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            {stats.sessionsToday}
          </motion.span>
          <span className="hero__unit">
            sesi hari ini
            {checkin && <span className="hero__via"> · {checkinLabel(checkin)}</span>}
          </span>
          <span
            className={`hero__delta mono ${
              stats.belowBaseline ? "is-good" : stats.sessionsToday > baseline ? "is-warn" : "is-good"
            }`}
          >
            {deltaLabel}
          </span>
        </div>
      </LiquidLevel>
    </section>
  );
}
