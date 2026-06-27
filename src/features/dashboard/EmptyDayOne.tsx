import { Sparkle } from "@phosphor-icons/react";
import { WhatIf } from "@/features/whatif/WhatIf";

/**
 * Day-one empty state: no saved money, no trend yet. Don't show bland zeros —
 * redirect the emotion to What If and a nudge to start logging.
 */
export function EmptyDayOne({
  baselineSessions,
  costPerSession,
}: {
  baselineSessions: number;
  costPerSession: number;
}) {
  return (
    <div className="emptyone">
      <div className="emptyone__lead">
        <Sparkle size={20} weight="fill" className="ink-aqua" />
        <p>
          Belum ada data buat ditampilin. Wajar, ini hari pertama. Tiap kali kamu
          tap <strong>Catat sesi</strong>, grafik dan tabungannya mulai keisi.
        </p>
      </div>
      <WhatIf baselineSessions={baselineSessions} costPerSession={costPerSession} />
    </div>
  );
}
