/** Subtle haptic feedback on mobile. No-op where unsupported. */
export function buzz(ms = 12): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported — ignore */
  }
}
