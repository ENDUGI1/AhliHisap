/** Indonesia-native formatting. Rupiah, ml, percentages. */

const rpFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** "Rp12.345" */
export const rp = (n: number): string => rpFmt.format(Math.round(n || 0));

/** Compact rupiah for big future-cast numbers: "Rp3,1jt", "Rp420rb". */
export function rpCompact(n: number): string {
  const v = Math.round(n || 0);
  if (v >= 1_000_000) {
    const jt = v / 1_000_000;
    return `Rp${jt.toFixed(jt >= 10 ? 0 : 1).replace(".", ",")}jt`;
  }
  if (v >= 1_000) {
    return `Rp${Math.round(v / 1_000)}rb`;
  }
  return rp(v);
}

export function ml(n: number, digits = 1): string {
  return `${(n || 0).toFixed(digits).replace(".", ",")} ml`;
}

export function pct(fraction: number): string {
  return `${Math.round(Math.abs(fraction) * 100)}%`;
}

/** Day key in local time, e.g. "2026-06-27" — used to bucket sessions by day. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const SHORT_DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export const shortDay = (ms: number): string => SHORT_DAYS[new Date(ms).getDay()];

export function timeOfDay(ms: number): string {
  return new Date(ms).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
