import { SealCheck } from "@phosphor-icons/react";
import { BADGES } from "@/lib/badges";

export function BadgesRow({ earned }: { earned: Set<string> }) {
  return (
    <section className="badges" aria-label="Pencapaian">
      <span className="badges__title">Pencapaian</span>
      <div className="badges__row">
        {BADGES.map((b) => {
          const got = earned.has(b.id);
          return (
            <div key={b.id} className={`badge ${got ? "is-got" : ""}`} title={b.desc}>
              <SealCheck size={22} weight={got ? "fill" : "regular"} />
              <span className="badge__name">{b.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
