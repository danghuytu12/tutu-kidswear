import { NextResponse } from "next/server";
import { getSalesSummary } from "@repo/ui/lib/db/repositories/stats";
import { sendMonthlyReportToTelegram } from "@repo/ui/lib/notify/telegram";
import { assertCronAuthorized, vnDayKey, previousMonthRange } from "../shared";

// The MongoDB driver needs the Node.js runtime; reports must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Monthly sales report. Meant to fire at 08:00 Asia/Ho_Chi_Minh (01:00 UTC) on
 * the 1st of each month and report the whole of the previous calendar month.
 * Wired to Vercel Cron in vercel.json.
 */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  try {
    const range = previousMonthRange(vnDayKey(new Date()));
    const summary = await getSalesSummary(range.from, range.to);
    await sendMonthlyReportToTelegram({
      from: summary.from,
      to: summary.to,
      orderCount: summary.orderCount,
      revenue: summary.revenue,
      products: summary.products,
    });
    return NextResponse.json({ ok: true, ...summary });
  } catch {
    return NextResponse.json(
      { error: "Failed to send monthly report" },
      { status: 500 },
    );
  }
}
