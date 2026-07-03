import { NextResponse } from "next/server";
import { getDashboardStats } from "@repo/ui/lib/db/repositories/stats";

// The MongoDB driver needs the Node.js runtime, and stats must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const stats = await getDashboardStats(new Date(), from, to);
    return NextResponse.json({ stats });
  } catch {
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 },
    );
  }
}
