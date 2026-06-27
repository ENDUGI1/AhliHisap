/**
 * Coach line — one supportive sentence. Template-driven for v1 (no LLM yet).
 * Hard rule from the brief: NEVER judgmental. Above baseline is not "failure".
 * For thrifty users, momentum is the hero, not rupiah.
 */

export interface CoachContext {
  sessionsToday: number;
  baselineSessions: number;
  hasLoggedToday: boolean;
  isFirstDay: boolean;
}

function pick(seed: number, arr: string[]): string {
  return arr[seed % arr.length];
}

export function coachLine(ctx: CoachContext): string {
  const { sessionsToday, baselineSessions, hasLoggedToday, isFirstDay } = ctx;
  // stable-per-day seed so the line doesn't flicker on each render
  const seed = new Date().getDate();

  if (isFirstDay && !hasLoggedToday) {
    return pick(seed, [
      "Hari pertama. Catat sesi pertamamu, sisanya ngalir.",
      "Belum ada data, itu wajar. Satu tap untuk mulai.",
      "Mulai dari satu catatan. Angkanya nyusul.",
    ]);
  }

  if (!hasLoggedToday) {
    return pick(seed, [
      "Belum nyatat hari ini. Santai, kapan pun siap.",
      "Hari baru, garis baru. Catat kalau sempat.",
    ]);
  }

  const delta = sessionsToday - baselineSessions;

  if (delta <= -Math.max(2, baselineSessions * 0.34)) {
    return pick(seed, [
      "Jauh di bawah biasanya. Ini momentum, pelihara.",
      "Hari yang ringan. Tubuhmu ikut senang.",
      "Lumayan turun banget hari ini. Mantap.",
    ]);
  }
  if (delta < 0) {
    return pick(seed, [
      "Di bawah garis biasanya. Sedikit, tapi nyata.",
      "Lebih sedikit dari biasanya. Arah yang benar.",
      "Turun tipis. Yang penting arahnya ke bawah.",
    ]);
  }
  if (delta === 0) {
    return pick(seed, [
      "Pas di garis biasanya. Besok coba kurangi satu.",
      "Stabil di baseline. Nggak apa-apa, ini titik mula.",
    ]);
  }
  // above baseline — gentle, never red
  return pick(seed, [
    "Di atas biasanya hari ini. Gak apa-apa, besok lagi.",
    "Hari yang berat ya. Besok kita coba pelan-pelan.",
    "Sedikit lebih banyak hari ini. Itu manusiawi.",
  ]);
}
