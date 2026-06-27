import { useState } from "react";
import { TrendUp } from "@phosphor-icons/react";
import { rp, rpCompact } from "@/lib/format";

/**
 * What If lite — the emotional engine. Slider: "kalau aku kurangi N sesi/hari".
 * Shows projected save per month & per year. Future-casting, front and centre.
 */
export function WhatIf({
  baselineSessions,
  costPerSession,
}: {
  baselineSessions: number;
  costPerSession: number;
}) {
  const maxCut = Math.max(baselineSessions, 1);
  const [cut, setCut] = useState(Math.min(2, maxCut));

  const perDay = cut * costPerSession;
  const perMonth = perDay * 30;
  const perYear = perDay * 365;
  const remaining = Math.max(baselineSessions - cut, 0);

  return (
    <section className="whatif" aria-label="What if">
      <div className="whatif__head">
        <TrendUp size={18} weight="bold" className="ink-amber" />
        <span className="whatif__title">Coba bayangin</span>
      </div>

      <p className="whatif__q">
        Kalau tiap hari aku kurangi{" "}
        <span className="whatif__cut mono">{cut}</span> sesi
        {remaining > 0 ? (
          <>
            {" "}
            <span className="whatif__rem">(sisa {remaining})</span>
          </>
        ) : null}
        …
      </p>

      <input
        className="whatif__slider"
        type="range"
        min={0}
        max={maxCut}
        step={1}
        value={cut}
        onChange={(e) => setCut(Number(e.target.value))}
        aria-label="Jumlah sesi yang dikurangi per hari"
      />

      <div className="whatif__results">
        <div className="whatif__cell">
          <span className="whatif__k mono">/ BULAN</span>
          <span className="whatif__v mono">{rp(perMonth)}</span>
        </div>
        <div className="whatif__cell whatif__cell--year">
          <span className="whatif__k mono">/ TAHUN</span>
          <span className="whatif__v mono">{rpCompact(perYear)}</span>
        </div>
      </div>
      <p className="whatif__foot">balik ke kantong kamu.</p>
    </section>
  );
}
