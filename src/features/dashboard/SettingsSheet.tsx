import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, PencilSimple } from "@phosphor-icons/react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Profile } from "@/db/types";
import { db } from "@/db/db";
import { Segmented, Field, Button } from "@/components/ui";
import { setMode, resetAll, updateBaselineManual } from "@/db/repo";
import { rp, ml } from "@/lib/format";

/** Light settings: switch mode, review & edit baseline, reset. */
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
  const [editing, setEditing] = useState(false);

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
              <div className="sheet__block-head">
                <span className="field__label">Baseline sekarang</span>
                <button className="sheet__edit" onClick={() => setEditing((v) => !v)}>
                  <PencilSimple size={14} weight="bold" />
                  {editing ? "Tutup" : "Ubah"}
                </button>
              </div>

              {!editing ? (
                <>
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
                </>
              ) : (
                <BaselineEditor profile={profile} onSaved={() => setEditing(false)} />
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

function BaselineEditor({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: () => void;
}) {
  const liquid = useLiveQuery(
    () => db.products.where("type").equals("liquid").first(),
    [],
  );

  const [sessions, setSessions] = useState(String(profile.baseline_sessions_day));
  const [price, setPrice] = useState("");
  const [mlSize, setMlSize] = useState("");
  const [days, setDays] = useState("");
  const [seeded, setSeeded] = useState(false);

  // seed once when the liquid product loads
  if (liquid && !seeded) {
    setPrice(String(liquid.bottle_price ?? ""));
    setMlSize(String(liquid.bottle_ml ?? ""));
    setDays(String(liquid.days_per_bottle ?? ""));
    setSeeded(true);
  }

  const valid =
    Number(sessions) > 0 && Number(price) > 0 && Number(mlSize) > 0 && Number(days) > 0;

  return (
    <div className="sheet__editor">
      <div className="ob__grid2">
        <Field
          label="Sesi / hari"
          value={sessions}
          onChange={(e) => setSessions(e.target.value.replace(/\D/g, ""))}
        />
        <Field
          label="Hari / botol"
          value={days}
          onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <div className="ob__grid2">
        <Field
          label="Harga botol"
          prefix="Rp"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
        />
        <Field
          label="Isi botol"
          suffix="ml"
          value={mlSize}
          onChange={(e) => setMlSize(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <Button
        full
        disabled={!valid}
        onClick={async () => {
          await updateBaselineManual({
            sessions_day: Number(sessions),
            bottle_price: Number(price),
            bottle_ml: Number(mlSize),
            days_per_bottle: Number(days),
          });
          onSaved();
        }}
      >
        Simpan baseline
      </Button>
    </div>
  );
}
