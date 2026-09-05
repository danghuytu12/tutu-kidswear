// Vietnam-time day-key helpers, shared by the cron report routes and the Shopee
// importer. Kept free of any Node-only imports so client components can use them.

/** Vietnam is UTC+7 (no daylight saving). */
export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * The current calendar day in Vietnam time as a YYYY-MM-DD key, computed from an
 * absolute instant — independent of the host server's own timezone.
 */
export function vnDayKey(now: Date): string {
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const y = vn.getUTCFullYear();
  const m = String(vn.getUTCMonth() + 1).padStart(2, "0");
  const d = String(vn.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Shift a YYYY-MM-DD key by `delta` days (may be negative), staying calendar-safe. */
export function addDays(key: string, delta: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). Negative when `to` precedes `from`. */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** The inclusive [from, to] day keys of the calendar month containing `key`. */
export function monthRange(key: string): { from: string; to: string } {
  const [y, m] = key.split("-").map(Number);
  // Day 0 of the next month is the last day of this one.
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}
