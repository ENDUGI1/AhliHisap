import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react";
import type { Profile } from "@/db/types";
import { Segmented } from "@/components/ui";
import { setMode, resetAll } from "@/db/repo";
import { rp, ml } from "@/lib/format";

/** Light settings: switch reduce/quit mode anytime, review baseline, reset. */
export function SettingsSheet({
  profile,
  open,
  onClose,
}: {
  profile: Profile;
  open: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sheet__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet"
            role="dialog"
            aria-label="Pengaturan"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="sheet__grab" />
            <div className="sheet__head">
              <h2 className="ob__h">Pengaturan</h2>
              <button className="sheet__x" onClick={onClose} aria-label="Tutup">
                <X size={20} />
              </button>
            </div>

            <div className="sheet__block">
              <span className="field__label">Mode</span>
              <Segmented
                label="Mode"
                value={profile.mode}
                onChange={(m) => setMode(m)}
                options={[
                  { value: "reduce", label: "Kurangi", hint: "pelan-pelan" },
                  { value: "quit", label: "Berhenti", hint: "kalau siap" },
                ]}
              />
              <p className="sheet__hint">
                Default-nya mengurangi. Nyalain mode berhenti kapan pun kamu merasa
                siap, tanpa tekanan.
              </p>
            </div>

            <div className="sheet__block">
              <span className="field__label">Baseline sekarang</span>
              <div className="sheet__stats">
                <div>
                  <span className="mono ink-aqua">{ml(profile.baseline_ml_day)}</span>
                  <small>per hari</small>
                </div>
                <div>
                  <span className="mono ink-amber">{rp(profile.baseline_cost_day)}</span>
                  <small>per hari</small>
                </div>
                <div>
                  <span className="mono">{profile.baseline_sessions_day}</span>
                  <small>sesi/hari</small>
                </div>
              </div>
              {profile.baseline_corrected_at && (
                <p className="sheet__hint">Sudah dikoreksi dari data nyatamu.</p>
              )}
            </div>

            <button
              className="sheet__danger"
              onClick={async () => {
                if (confirm("Hapus semua data dan mulai ulang dari awal?")) {
                  await resetAll();
                  location.reload();
                }
              }}
            >
              Mulai ulang dari awal
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
