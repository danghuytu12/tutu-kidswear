import { NextResponse } from "next/server";

/** Vietnam is UTC+7 (no daylight saving). */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

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

/**
 * The inclusive [from, to] YYYY-MM-DD span of the calendar month immediately
 * before the one containing `todayKey`. E.g. todayKey "2026-08-01" → the whole
 * of July 2026 ("2026-07-01" … "2026-07-31").
 */
export function previousMonthRange(todayKey: string): {
  from: string;
  to: string;
} {
  const [y, m] = todayKey.split("-").map(Number);
  // First day of the current month, then step back one day → last day of prev.
  const firstOfThis = new Date(Date.UTC(y, m - 1, 1));
  const lastOfPrev = new Date(firstOfThis.getTime());
  lastOfPrev.setUTCDate(0); // day 0 of this month = last day of previous month
  const py = lastOfPrev.getUTCFullYear();
  const pm = String(lastOfPrev.getUTCMonth() + 1).padStart(2, "0");
  const lastDay = String(lastOfPrev.getUTCDate()).padStart(2, "0");
  return { from: `${py}-${pm}-01`, to: `${py}-${pm}-${lastDay}` };
}

/**
 * Optional bearer-token guard for cron endpoints. If CRON_SECRET is set in the
 * environment, the request must carry `Authorization: Bearer <secret>` (the
 * header Vercel Cron sends automatically). If CRON_SECRET is unset, the endpoint
 * is open. Returns a 401 response to short-circuit on denial, or null to proceed.
 */
export function assertCronAuthorized(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
