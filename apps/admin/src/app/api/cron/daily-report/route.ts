import { NextResponse } from "next/server";
import { getSalesSummary } from "@repo/ui/lib/db/repositories/stats";
import { sendDailyReportToTelegram } from "@repo/ui/lib/notify/telegram";
import { assertCronAuthorized, vnDayKey, addDays } from "../shared";

// The MongoDB driver needs the Node.js runtime; reports must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily sales report. Meant to fire at 08:00 Asia/Ho_Chi_Minh (01:00 UTC) and
 * report the previous calendar day. Wired to Vercel Cron in vercel.json.
 */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  try {
    // "Yesterday" in Vietnam time — independent of the server's own timezone.
    const yesterday = addDays(vnDayKey(new Date()), -1);
    const summary = await getSalesSummary(yesterday, yesterday);
    await sendDailyReportToTelegram({
      day: yesterday,
      orderCount: summary.orderCount,
      revenue: summary.revenue,
      products: summary.products,
    });
    return NextResponse.json({ ok: true, ...summary });
  } catch {
    return NextResponse.json(
      { error: "Failed to send daily report" },
      { status: 500 },
    );
  }
}
