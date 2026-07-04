import { headers } from "next/headers";
import type { DashboardStats } from "@repo/ui/lib/db/repositories/stats";
import { DashboardClient } from "@/components/DashboardClient";

// Read live from the shared DB via the stats API; never cache at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPTY_STATS: DashboardStats = {
  productCount: 0,
  ordersInRange: 0,
  customerCount: 0,
  revenue: 0,
  from: "",
  to: "",
  daily: [],
  statusBreakdown: [],
  topProducts: [],
};

// Fetch dashboard stats from our own /api/stats endpoint. The absolute origin is
// rebuilt from the incoming request headers (self-fetch in a Server Component).
async function loadStats(): Promise<DashboardStats> {
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const res = await fetch(`${proto}://${host}/api/stats`, {
      cache: "no-store",
    });
    if (!res.ok) return EMPTY_STATS;
    const data = (await res.json()) as { stats: DashboardStats };
    return data.stats;
  } catch {
    return EMPTY_STATS;
  }
}

export default async function DashboardPage() {
  const stats = await loadStats();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-[28px] font-bold text-black">Tổng quan</h1>
      <p className="mt-1 text-[14px] text-black/50">
        Bảng điều khiển quản trị cửa hàng Tutu Kidswear.
      </p>

      <DashboardClient initial={stats} />
    </div>
  );
}
