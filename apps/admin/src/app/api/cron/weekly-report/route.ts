import { NextResponse } from "next/server";
import { getSalesSummary } from "@repo/ui/lib/db/repositories/stats";
import { sendWeeklyReportToTelegram } from "@repo/ui/lib/notify/telegram";
import { assertCronAuthorized, vnDayKey, addDays } from "../shared";

// The MongoDB driver needs the Node.js runtime; reports must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Weekly sales report. Meant to fire at 08:00 Asia/Ho_Chi_Minh (01:00 UTC) on
 * Sunday and report Mon→Sat of the week that just ended. When it runs on Sunday,
 * yesterday is that Saturday and Monday is six days before it. Wired to Vercel
 * Cron in vercel.json.
 */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  try {
    const today = vnDayKey(new Date());
    const saturday = addDays(today, -1); // T7 (hôm qua)
    const monday = addDays(today, -6); // T2
    const summary = await getSalesSummary(monday, saturday);
    await sendWeeklyReportToTelegram({
      from: summary.from,
      to: summary.to,
      orderCount: summary.orderCount,
      revenue: summary.revenue,
      products: summary.products,
    });
    return NextResponse.json({ ok: true, ...summary });
  } catch {
    return NextResponse.json(
      { error: "Failed to send weekly report" },
      { status: 500 },
    );
  }
}
