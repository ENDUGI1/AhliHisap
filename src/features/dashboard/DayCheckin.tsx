import { Pulse } from "@phosphor-icons/react";
import type { CheckinLevel } from "@/db/types";
import { CHECKIN_LEVELS } from "@/lib/checkin";
import { setCheckin } from "@/db/repo";
import { buzz } from "@/lib/haptics";

/**
 * Once-a-day momentum input for people who won't tap every session.
 * Tapping a level sets today's effective usage; tapping the active one clears it.
 */
export function DayCheckin({ active }: { active: CheckinLevel | null }) {
  return (
    <section className="checkin" aria-label="Check-in hari ini">
      <div className="checkin__head">
        <Pulse size={18} weight="bold" className="ink-aqua" />
        <span className="checkin__title">Males ngitung? Set langsung hari ini</span>
      </div>
      <div className="checkin__row" role="radiogroup" aria-label="Seberapa banyak hari ini">
        {CHECKIN_LEVELS.map((l) => {
          const on = active === l.key;
          return (
            <button
              key={l.key}
              role="radio"
              aria-checked={on}
              className={`checkin__opt ${on ? "is-on" : ""} checkin__opt--${l.key}`}
              onClick={() => {
                buzz();
                void setCheckin(l.key);
              }}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
