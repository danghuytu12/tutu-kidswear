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
import { Pagination, PAGE_SIZE, parsePage } from "@/components/Pagination";
import { CustomerImport } from "@/components/CustomerImport";
import {
  CardEmpty,
  CardField,
  MobileCard,
  MobileCardList,
} from "@/components/MobileCard";

// Read live from the shared MongoDB; never cache at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatVnd(price: number): string {
  return `${price.toLocaleString("vi-VN")} ₫`;
}

// Format an ISO date -> "01 Dec, 2027" (admin-facing).
/** Imported customers who have not ordered yet have no date — show a dash. */
function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ORIGIN_LABELS = {
  order: "Từ đơn hàng",
  import: "Nhập từ file",
  both: "Cả hai",
} as const;

const ORIGIN_STYLES = {
  order: "bg-[#F2F4F7] text-[#344054]",
  import: "bg-[#EEF4FF] text-[#3538CD]",
  both: "bg-[#ECFDF3] text-[#027A48]",
} as const;

function OriginBadge({ origin }: { origin: CustomerWithPurchases["origin"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ORIGIN_STYLES[origin]}`}
    >
      {ORIGIN_LABELS[origin]}
    </span>
  );
}

async function loadCustomers(): Promise<CustomerWithPurchases[]> {
  try {
    return await getCustomersWithPurchases();
  } catch {
    // DB unreachable / not configured — render an empty table rather than break.
    return [];
  }
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const customers = await loadCustomers();

  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const page = parsePage(pageParam, totalPages);
  const pageCustomers = customers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

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

      <CustomerImport />

      <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
        <div className="flex flex-col justify-between gap-5 border-b border-[#E4E7EC] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
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

        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E4E7EC] hover:bg-transparent">
                {[
                  "Khách hàng",
                  "Nguồn",
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
                  <TableCell colSpan={7} className="py-16 text-center">
                    <p className="text-sm text-[#667085]">
                      Chưa có khách hàng nào mua hàng.
                    </p>
                  </TableCell>
                </TableRow>
              ) : null}
              {pageCustomers.map((c) => (
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
                  <TableCell className="whitespace-nowrap">
                    <OriginBadge origin={c.origin} />
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
                    <span className="text-sm text-[#667085]">
                      {c.orderCount}
                    </span>
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
        </div>

        {customers.length === 0 ? (
          <CardEmpty>Chưa có khách hàng nào mua hàng.</CardEmpty>
        ) : (
          <MobileCardList>
            {pageCustomers.map((c) => (
              <MobileCard key={`m-${c.phone}|${c.name}`}>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1D2939]">
                    {c.name}
                  </span>
                  <span className="text-xs text-[#667085]">{c.phone}</span>
                  <span className="mt-1">
                    <OriginBadge origin={c.origin} />
                  </span>
                </div>

                <ul className="space-y-1 border-y border-[#F2F4F7] py-3">
                  {c.products.map((p, i) => (
                    <li
                      key={`${c.phone}-m-${i}`}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="text-[#667085]">{p.name}</span>
                      <span className="shrink-0 font-medium text-[#344054]">
                        ×{p.qty}
                      </span>
                    </li>
                  ))}
                </ul>

                <CardField label="Tổng SL">{c.totalItems}</CardField>
                <CardField label="Số đơn">{c.orderCount}</CardField>
                <CardField label="Tổng chi">
                  {formatVnd(c.totalSpent)}
                </CardField>
                <CardField label="Mua gần nhất">
                  {formatDate(c.lastOrderAt)}
                </CardField>
              </MobileCard>
            ))}
          </MobileCardList>
        )}

        <Pagination
          pathname="/customers"
          searchParams={{}}
          page={page}
          totalItems={customers.length}
        />
      </div>
    </div>
  );
}
