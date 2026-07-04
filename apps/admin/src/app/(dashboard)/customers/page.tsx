import { ChevronRight } from "lucide-react";
import {
  getCustomersWithPurchases,
  type CustomerWithPurchases,
} from "@repo/ui/lib/db/repositories/customers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";

// Read live from the shared MongoDB; never cache at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatVnd(price: number): string {
  return `${price.toLocaleString("vi-VN")} ₫`;
}

// Format an ISO date -> "01 Dec, 2027" (admin-facing).
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function loadCustomers(): Promise<CustomerWithPurchases[]> {
  try {
    return await getCustomersWithPurchases();
  } catch {
    // DB unreachable / not configured — render an empty table rather than break.
    return [];
  }
}

export default async function CustomersPage() {
  const customers = await loadCustomers();

  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[#1D2939]">Khách hàng</h1>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-[#667085]">Home</span>
          <ChevronRight className="h-4 w-4 text-[#667085]" />
          <span className="text-[#1D2939]">Khách hàng</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
        <div className="flex flex-col justify-between gap-5 border-b border-[#E4E7EC] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-[#1D2939]">
              Khách hàng đã mua hàng
            </h3>
            <p className="mt-1 text-sm text-[#667085]">
              Tổng hợp từ đơn hàng: mỗi khách đã mua sản phẩm gì, số lượng bao
              nhiêu.
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-[#E4E7EC] hover:bg-transparent">
              {[
                "Khách hàng",
                "Sản phẩm đã mua",
                "Tổng SL",
                "Số đơn",
                "Tổng chi",
                "Mua gần nhất",
              ].map((label) => (
                <TableHead key={label} className="text-[#344054]">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-16 text-center">
                  <p className="text-sm text-[#667085]">
                    Chưa có khách hàng nào mua hàng.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
            {customers.map((c) => (
              <TableRow
                key={`${c.phone}|${c.name}`}
                className="border-[#E4E7EC] hover:bg-gray-50"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#344054]">
                      {c.name}
                    </span>
                    <span className="text-xs text-[#667085]">{c.phone}</span>
                  </div>
                </TableCell>
                <TableCell className="min-w-[280px]">
                  <ul className="space-y-1">
                    {c.products.map((p, i) => (
                      <li
                        key={`${c.phone}-${i}`}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="text-[#667085]">{p.name}</span>
                        <span className="shrink-0 font-medium text-[#344054]">
                          ×{p.qty}
                        </span>
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="text-sm font-medium text-[#344054]">
                    {c.totalItems}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="text-sm text-[#667085]">{c.orderCount}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="text-sm font-medium text-[#344054]">
                    {formatVnd(c.totalSpent)}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="text-sm text-[#667085]">
                    {formatDate(c.lastOrderAt)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="border-t border-[#E4E7EC] px-5 py-4">
          <p className="text-sm text-[#667085]">
            {customers.length === 0
              ? "Showing 0 of 0"
              : `Showing 1 to ${customers.length} of ${customers.length}`}
          </p>
        </div>
      </div>
    </div>
  );
}
