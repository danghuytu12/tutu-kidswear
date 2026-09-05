import { NextResponse } from "next/server";

// vnDayKey/addDays moved to @repo/ui so the Shopee importer (which lives in the
// shared package) can use them too — a package cannot import back out of an app.
// Re-exported here so existing cron route imports keep working unchanged.
export { vnDayKey, addDays } from "@repo/ui/lib/date/vn";

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
