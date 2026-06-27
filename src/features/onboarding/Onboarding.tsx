import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowLeft,
  Drop,
  Cigarette,
  CheckCircle,
} from "@phosphor-icons/react";
import { Button, Field, Segmented, Card } from "@/components/ui";
import { LiquidLevel } from "@/components/LiquidLevel";
import {
  FREQUENCY_PRESETS,
  SESSIONS_BY_FREQUENCY,
  COIL_DEFAULTS,
  type FrequencyKey,
} from "@/lib/presets";
import { baselineCostDay, baselineMlDay } from "@/lib/formula";
import { rp, rpCompact, ml } from "@/lib/format";
import { completeOnboarding } from "@/db/repo";
import "./Onboarding.css";

type Uses = { vape: boolean; cigarette: boolean };

const STEPS = 5;

export function Onboarding({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [uses, setUses] = useState<Uses>({ vape: true, cigarette: false });
  const [freq, setFreq] = useState<FrequencyKey>("sedang");
  const [price, setPrice] = useState("120000");
  const [mlSize, setMlSize] = useState("60");

  const [coilOn, setCoilOn] = useState(false);
  const [coilPrice, setCoilPrice] = useState(String(COIL_DEFAULTS.pack_price));
  const [coilUnits, setCoilUnits] = useState(String(COIL_DEFAULTS.units_per_pack));
  const [coilWeeks, setCoilWeeks] = useState(String(COIL_DEFAULTS.change_weeks));

  const days_per_bottle =
    FREQUENCY_PRESETS.find((f) => f.key === freq)?.days_per_bottle ?? 14;

  const liquid = {
    bottle_price: Number(price) || 0,
    bottle_ml: Number(mlSize) || 0,
    days_per_bottle,
  };
  const coil = coilOn
    ? {
        pack_price: Number(coilPrice) || 0,
        units_per_pack: Number(coilUnits) || 0,
        change_weeks: Number(coilWeeks) || 0,
      }
    : null;

  const costDay = useMemo(() => baselineCostDay(liquid, coil), [liquid, coil]);
  const mlDay = useMemo(() => baselineMlDay(liquid), [liquid]);
  const fillLevel = days_per_bottle / 21; // longer-lasting => fuller, calmer

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  async function finish() {
    await completeOnboarding({
      uses,
      liquid: { ...liquid, name: "Liquid" },
      coil: coil ? { ...coil, name: "Coil" } : null,
      baseline_sessions_day: SESSIONS_BY_FREQUENCY[freq],
    });
    onDone();
  }

  const liquidValid = liquid.bottle_price > 0 && liquid.bottle_ml > 0;

  const slide = {
    initial: reduce ? {} : { opacity: 0, x: dir * 28 },
    animate: { opacity: 1, x: 0 },
    exit: reduce ? {} : { opacity: 0, x: dir * -28 },
    transition: { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] as const },
  };

  return (
    <div className="ob">
      <header className="ob__top">
        <div className="ob__dots" aria-label={`Langkah ${step + 1} dari ${STEPS}`}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <span key={i} className={`ob__dot ${i <= step ? "is-on" : ""}`} />
          ))}
        </div>
        {step > 0 && (
          <button className="ob__back" onClick={() => go(step - 1)} aria-label="Kembali">
            <ArrowLeft size={20} />
          </button>
        )}
      </header>

      <main className="ob__stage">
        <AnimatePresence mode="wait" custom={dir}>
          {/* ---------- 1. Welcome ---------- */}
          {step === 0 && (
            <motion.section key="s0" className="ob__panel" {...slide}>
              <LiquidLevel level={0.62} height={150} className="ob__hero-liquid">
                <span className="ob__hero-tag mono">REDUCTION&nbsp;MODE</span>
              </LiquidLevel>
              <h1 className="ob__title">
                Bukan berhenti paksa.
                <br />
                <span className="ink-aqua">Pelan-pelan mereda.</span>
              </h1>
              <p className="ob__lead">
                AhliHisap nemenin kamu ngurangin vape, tanpa ngehakimi, dan
                nunjukin uang yang balik ke kantong. Atur sendiri ritmenya.
              </p>
              <Button full onClick={() => go(1)}>
                Mulai <ArrowRight size={18} weight="bold" />
              </Button>
            </motion.section>
          )}

          {/* ---------- 2. What do you use ---------- */}
          {step === 1 && (
            <motion.section key="s1" className="ob__panel" {...slide}>
              <h2 className="ob__h">Yang kamu pakai?</h2>
              <p className="ob__sub">Bisa pilih dua-duanya.</p>
              <div className="ob__choices">
                <ChoiceTile
                  active={uses.vape}
                  icon={<Drop size={26} weight="fill" />}
                  label="Vape"
                  note="liquid + coil"
                  onClick={() => setUses((u) => ({ ...u, vape: !u.vape }))}
                />
                <ChoiceTile
                  active={uses.cigarette}
                  icon={<Cigarette size={26} weight="fill" />}
                  label="Rokok"
                  note="segera hadir"
                  onClick={() => setUses((u) => ({ ...u, cigarette: !u.cigarette }))}
                />
              </div>
              {uses.cigarette && !uses.vape && (
                <p className="ob__note">
                  Mode rokok masih disiapkan. Untuk sekarang kita mulai dari vape
                  dulu, ya.
                </p>
              )}
              <Button full onClick={() => go(2)}>
                Lanjut <ArrowRight size={18} weight="bold" />
              </Button>
            </motion.section>
          )}

          {/* ---------- 3. Baseline liquid (crucial) ---------- */}
          {step === 2 && (
            <motion.section key="s2" className="ob__panel" {...slide}>
              <h2 className="ob__h">Liquid kamu</h2>
              <p className="ob__sub">Angka kira-kira aja, nanti dikoreksi otomatis.</p>

              <div className="ob__fields">
                <Field
                  label="Harga sebotol"
                  prefix="Rp"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="120000"
                />
                <Field
                  label="Isi botol"
                  suffix="ml"
                  value={mlSize}
                  onChange={(e) => setMlSize(e.target.value.replace(/\D/g, ""))}
                  placeholder="60"
                />
              </div>

              <span className="field__label">Seberapa cepat habis?</span>
              <Segmented
                label="Frekuensi botol"
                value={freq}
                onChange={setFreq}
                options={FREQUENCY_PRESETS.map((f) => ({
                  value: f.key,
                  label: f.label,
                  hint: f.hint.replace("± ", ""),
                }))}
              />

              <LiquidLevel level={fillLevel} height={116} tone="aqua" className="ob__live">
                <div className="ob__live-row">
                  <div className="ob__live-stat">
                    <span className="ob__live-k mono">/ HARI</span>
                    <span className="ob__live-v mono">{rp(costDay)}</span>
                  </div>
                  <div className="ob__live-stat">
                    <span className="ob__live-k mono">LIQUID</span>
                    <span className="ob__live-v mono">{ml(mlDay)}</span>
                  </div>
                  <div className="ob__live-stat ob__live-stat--year">
                    <span className="ob__live-k mono">SETAHUN</span>
                    <span className="ob__live-v ob__live-v--amber mono">
                      {rpCompact(costDay * 365)}
                    </span>
                  </div>
                </div>
              </LiquidLevel>

              <Button full onClick={() => go(3)} disabled={!liquidValid}>
                Lanjut <ArrowRight size={18} weight="bold" />
              </Button>
            </motion.section>
          )}

          {/* ---------- 4. Coil (optional) ---------- */}
          {step === 3 && (
            <motion.section key="s3" className="ob__panel" {...slide}>
              <h2 className="ob__h">Coil (opsional)</h2>
              <p className="ob__sub">Biaya latar otomatis. Boleh dilewati.</p>

              <Card className="ob__toggle-card">
                <div>
                  <div className="ob__toggle-title">Hitung biaya coil?</div>
                  <div className="ob__toggle-sub">Nggak perlu dicatat harian.</div>
                </div>
                <button
                  role="switch"
                  aria-checked={coilOn}
                  className={`switch ${coilOn ? "is-on" : ""}`}
                  onClick={() => setCoilOn((v) => !v)}
                >
                  <span className="switch__dot" />
                </button>
              </Card>

              {coilOn && (
                <motion.div
                  className="ob__fields"
                  initial={reduce ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <Field
                    label="Harga sepaket"
                    prefix="Rp"
                    value={coilPrice}
                    onChange={(e) => setCoilPrice(e.target.value.replace(/\D/g, ""))}
                  />
                  <div className="ob__grid2">
                    <Field
                      label="Isi/paket"
                      suffix="pcs"
                      value={coilUnits}
                      onChange={(e) => setCoilUnits(e.target.value.replace(/\D/g, ""))}
                    />
                    <Field
                      label="Ganti tiap"
                      suffix="mgg"
                      value={coilWeeks}
                      onChange={(e) => setCoilWeeks(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </motion.div>
              )}

              <div className="ob__spacer" />
              <Button full onClick={() => go(4)}>
                {coilOn ? "Lanjut" : "Lewati"} <ArrowRight size={18} weight="bold" />
              </Button>
            </motion.section>
          )}

          {/* ---------- 5. Summary ---------- */}
          {step === 4 && (
            <motion.section key="s4" className="ob__panel" {...slide}>
              <h2 className="ob__h">Kira-kira segini</h2>
              <p className="ob__sub">Tebakan awal, dikoreksi setelah 7 hari nyatat.</p>

              <div className="ob__summary">
                <SummaryRow k="Per hari" v={rp(costDay)} />
                <SummaryRow k="Per bulan" v={rp(costDay * 30)} />
                <SummaryRow k="Per tahun" v={rpCompact(costDay * 365)} accent />
                <SummaryRow k="Liquid / hari" v={ml(mlDay)} />
              </div>

              <Card className="ob__promise">
                <CheckCircle size={22} weight="fill" className="ink-aqua" />
                <p>
                  Angka di atas cuma tebakan. Begitu kamu mulai nyatat, AhliHisap
                  ngitung rata-rata aslimu dan nawarin koreksi otomatis.
                </p>
              </Card>

              <Button full tone="amber" onClick={finish}>
                Masuk ke AhliHisap <ArrowRight size={18} weight="bold" />
              </Button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ChoiceTile({
  active,
  icon,
  label,
  note,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`choice ${active ? "is-on" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="choice__icon">{icon}</span>
      <span className="choice__label">{label}</span>
      <span className="choice__note mono">{note}</span>
    </button>
  );
}

function SummaryRow({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="srow">
      <span className="srow__k">{k}</span>
      <span className={`srow__v mono ${accent ? "ink-amber" : ""}`}>{v}</span>
    </div>
  );
}
