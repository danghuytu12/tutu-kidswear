import {
  getDashboardStats,
  type DashboardStats,
} from "@repo/ui/lib/db/repositories/stats";
import { listLowStockVariants } from "@repo/ui/lib/db/repositories/inventory";
import { DashboardClient } from "@/components/DashboardClient";
import { LowStockAlert } from "@/components/LowStockAlert";

// Read live from the shared DB; never cache at build time.
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

// Query the DB directly. (A self-fetch of /api/stats doesn't carry the
// session cookie, so it was rejected with 401 and the page always loaded
// empty.) The page itself is already behind the auth middleware.
async function loadStats(): Promise<DashboardStats> {
  try {
    return await getDashboardStats(new Date());
  } catch {
    return EMPTY_STATS;
  }
}

async function loadLowStock() {
  try {
    return await listLowStockVariants();
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const [stats, lowStock] = await Promise.all([loadStats(), loadLowStock()]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Phones show the section name in the topbar instead. */}
      <h1 className="sr-only font-display text-[28px] font-bold text-black sm:not-sr-only">
        Tổng quan
      </h1>
      <p className="mt-1 hidden text-[14px] text-black/50 sm:block">
        Bảng điều khiển quản trị cửa hàng Tutu Kidswear.
      </p>

      <LowStockAlert items={lowStock} />
      <DashboardClient initial={stats} />
    </div>
  );
}
