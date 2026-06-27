import type { TrendDay } from "@/db/stats";

/** 7-day bars with a dashed baseline line. Aqua under, coral over. */
export function Trend({
  trend,
  baseline,
}: {
  trend: TrendDay[];
  baseline: number;
}) {
  const peak = Math.max(baseline * 1.4, ...trend.map((d) => d.count), 1);
  const baselineTop = (1 - baseline / peak) * 100;
  const hasAny = trend.some((d) => d.count > 0);

  return (
    <div className="trend">
      <div className="trend__head">
        <span className="trend__title">7 hari terakhir</span>
        <span className="trend__legend mono">garis · biasanya {baseline}</span>
      </div>
      <div className="trend__plot">
        <div className="trend__baseline" style={{ top: `${baselineTop}%` }} aria-hidden />
        {trend.map((d) => {
          const h = (d.count / peak) * 100;
          const over = d.count > baseline;
          return (
            <div key={d.key} className="trend__col">
              <div className="trend__bar-track">
                <div
                  className={`trend__bar ${over ? "is-over" : "is-under"} ${
                    d.isToday ? "is-today" : ""
                  }`}
                  style={{ height: `${Math.max(h, d.count > 0 ? 6 : 0)}%` }}
                  title={`${d.label}: ${d.count} sesi`}
                />
              </div>
              <span className={`trend__label mono ${d.isToday ? "is-today" : ""}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      {!hasAny && <p className="trend__empty">Belum ada catatan minggu ini.</p>}
    </div>
  );
}
