import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Plus,
  Flask,
  ArrowCounterClockwise,
  Gear,
  Coins,
  DownloadSimple,
} from "@phosphor-icons/react";
import type { Profile } from "@/db/types";
import { useDashboard, useBaselineSuggestion, useEarnedBadges } from "@/hooks/useData";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import {
  logSession,
  undoLastSession,
  logBottleEvent,
  undoLastBottleEvent,
  correctBaseline,
  syncBadges,
} from "@/db/repo";
import { evaluateBadges } from "@/lib/badges";
import { coachLine } from "@/lib/coach";
import { rp, ml } from "@/lib/format";
import { buzz } from "@/lib/haptics";
import { MomentumHero } from "./MomentumHero";
import { Trend } from "./Trend";
import { WhatIf } from "@/features/whatif/WhatIf";
import { BadgesRow } from "./BadgesRow";
import { SettingsSheet } from "./SettingsSheet";
import { EmptyDayOne } from "./EmptyDayOne";
import { DayCheckin } from "./DayCheckin";
import "./Dashboard.css";

export function Dashboard({ profile }: { profile: Profile }) {
  const reduce = useReducedMotion();
  const stats = useDashboard(profile);
  const suggestion = useBaselineSuggestion(profile);
  const earned = useEarnedBadges();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [toast, setToast] = useState<{ msg: string; undo?: () => Promise<void> } | null>(
    null,
  );
  const toastTimer = useRef<number | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // keep badges in sync with momentum (silent)
  useEffect(() => {
    if (!stats) return;
    const ids = evaluateBadges({
      daysLogged: stats.daysLogged,
      belowBaselineDays: stats.belowBaselineDays,
      totalSaved: stats.totalSaved,
      loggedToday: stats.hasLoggedToday,
    });
    void syncBadges(ids);
  }, [stats]);

  if (!stats) {
    return (
      <div className="dash__loading">
        <div className="skeleton skeleton--hero" />
        <div className="skeleton" />
      </div>
    );
  }

  const isFirstDay = stats.daysLogged === 0 && !stats.hasLoggedToday;

  async function onLog() {
    buzz();
    await logSession();
    flash("Tercatat · 1 sesi", undoLastSession);
  }
  async function onBottle() {
    buzz(18);
    await logBottleEvent();
    flash("Botol baru tercatat", undoLastBottleEvent);
  }
  function flash(msg: string, undo?: () => Promise<void>) {
    setToast({ msg, undo });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }

  const greeting = greetByHour();

  return (
    <div className="dash">
      <header className="dash__top">
        <div>
          <p className="dash__hello">{greeting}</p>
          <h1 className="dash__brand">
            Ahli<span className="ink-aqua">Hisap</span>
          </h1>
        </div>
        <div className="dash__top-actions">
          {canInstall && (
            <button className="dash__install" onClick={promptInstall}>
              <DownloadSimple size={16} weight="bold" />
              Pasang
            </button>
          )}
          <button
            className="dash__gear"
            onClick={() => setSettingsOpen(true)}
            aria-label="Pengaturan"
          >
            <Gear size={22} />
          </button>
        </div>
      </header>

      {suggestion?.ready && (
        <BaselineBanner
          actualCostDay={suggestion.actualCostDay}
          actualMlDay={suggestion.actualMlDay}
          onApply={async () => {
            await correctBaseline(suggestion.actualCostDay, suggestion.actualMlDay);
            flash("Baseline diperbarui");
          }}
        />
      )}

      <MomentumHero
        stats={stats}
        baseline={profile.baseline_sessions_day}
        checkin={stats.todayCheckin}
      />

      <p className="dash__coach">
        {coachLine({
          sessionsToday: stats.sessionsToday,
          baselineSessions: profile.baseline_sessions_day,
          hasLoggedToday: stats.hasLoggedToday,
          isFirstDay,
        })}
      </p>

      <DayCheckin active={stats.todayCheckin} />

      {isFirstDay ? (
        <EmptyDayOne
          baselineSessions={profile.baseline_sessions_day}
          costPerSession={stats.costPerSession}
        />
      ) : (
        <>
          <div className="dash__cards">
            <section className="moneycard" aria-label="Uang yang sudah kembali">
              <div className="moneycard__head">
                <Coins size={18} weight="fill" className="ink-amber" />
                <span>Uang kembali</span>
              </div>
              <span className="moneycard__v mono">{rp(stats.totalSaved)}</span>
              <span className="moneycard__sub mono">
                {stats.belowBaselineDays} hari di bawah biasanya
              </span>
            </section>

            <Trend trend={stats.trend} baseline={profile.baseline_sessions_day} />
          </div>

          <WhatIf
            baselineSessions={profile.baseline_sessions_day}
            costPerSession={stats.costPerSession}
          />

          <BadgesRow earned={earned ?? new Set()} />
        </>
      )}

      <div className="dash__scrollpad" />

      {/* bottom action bar */}
      <div className="actionbar">
        <button className="actionbar__bottle" onClick={onBottle}>
          <Flask size={20} weight="fill" />
          <span>Botol baru</span>
        </button>
        <button className="actionbar__log" onClick={onLog}>
          <Plus size={22} weight="bold" />
          <span>Catat sesi</span>
        </button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
            role="status"
          >
            <span>{toast.msg}</span>
            {toast.undo && (
              <button
                className="toast__undo"
                onClick={async () => {
                  const fn = toast.undo;
                  setToast(null);
                  await fn?.();
                }}
              >
                <ArrowCounterClockwise size={15} weight="bold" /> Urungkan
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsSheet
        profile={profile}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        canInstall={canInstall}
        onInstall={promptInstall}
      />
    </div>
  );
}

function BaselineBanner({
  actualCostDay,
  actualMlDay,
  onApply,
}: {
  actualCostDay: number;
  actualMlDay: number;
  onApply: () => void;
}) {
  return (
    <div className="bbanner">
      <p>
        Rata-ratamu ternyata <span className="mono ink-aqua">{ml(actualMlDay)}</span> ·{" "}
        <span className="mono ink-amber">{rp(actualCostDay)}</span>/hari. Update
        baseline?
      </p>
      <button className="bbanner__apply" onClick={onApply}>
        Update
      </button>
    </div>
  );
}

function greetByHour(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}
