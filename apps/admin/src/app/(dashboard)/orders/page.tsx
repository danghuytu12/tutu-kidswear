import { ChevronRight } from "lucide-react";
import { listOrders, searchOrders } from "@repo/ui/lib/db/repositories/orders";
import type { OrderDoc } from "@repo/ui/lib/db/types";
import { OrderSearch } from "@/components/OrderSearch";
import { OrdersTable } from "@/components/OrdersTable";
import { Pagination, PAGE_SIZE, parsePage } from "@/components/Pagination";

// Read live from the shared MongoDB; never cache at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadOrders(query: string): Promise<OrderDoc[]> {
  try {
    return query ? await searchOrders(query) : await listOrders();
  } catch {
    // DB unreachable / not configured — render an empty table rather than break.
    return [];
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const orders = await loadOrders(query);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const page = parsePage(pageParam, totalPages);
  const pageOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[#1D2939]">Đơn hàng</h1>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-[#667085]">Home</span>
          <ChevronRight className="h-4 w-4 text-[#667085]" />
          <span className="text-[#1D2939]">Đơn hàng</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
        <div className="flex flex-col justify-between gap-5 border-b border-[#E4E7EC] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-[#1D2939]">
              Danh sách đơn hàng
            </h3>
            <p className="mt-1 text-sm text-[#667085]">
              Quản lý và theo dõi đơn hàng của khách.
            </p>
          </div>
          <OrderSearch />
        </div>

        <OrdersTable orders={pageOrders} query={query} />

        <Pagination
          pathname="/orders"
          searchParams={{ q: query || undefined }}
          page={page}
          totalItems={orders.length}
        />
      </div>
    </div>
  );
}
