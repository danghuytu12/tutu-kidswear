import { ChevronRight } from "lucide-react";
import {
  getShopeeDailyRevenue,
  getShopeeOrders,
  getShopeeStatusBreakdown,
  getShopeeSummary,
  getShopeeTopProducts,
  listShopeeImports,
  type ShopeeDailyRevenue,
  type ShopeeOrderSummary,
  type ShopeeStatusCount,
  type ShopeeSummary,
  type ShopeeTopProduct,
} from "@repo/ui/lib/db/repositories/shopee";
import type { ShopeeImportDoc } from "@repo/ui/lib/db/types";
import { formatVnd } from "@repo/ui/lib/cart";
import { monthRange, vnDayKey } from "@repo/ui/lib/date/vn";
import { formatDayKey } from "@repo/ui/lib/shopee/filename";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { ShopeeUpload } from "@/components/ShopeeUpload";
import { ShopeeDateFilter } from "@/components/ShopeeDateFilter";
import { DeleteShopeeImportButton } from "@/components/DeleteShopeeImportButton";
import { Pagination, PAGE_SIZE, parsePage } from "@/components/Pagination";
import { CardField, MobileCard, MobileCardList } from "@/components/MobileCard";

// Read live from the shared MongoDB; never cache at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ShopeeData {
  summary: ShopeeSummary;
  daily: ShopeeDailyRevenue[];
  products: ShopeeTopProduct[];
  orders: ShopeeOrderSummary[];
  statuses: ShopeeStatusCount[];
  imports: ShopeeImportDoc[];
}

const EMPTY: ShopeeData = {
  summary: { revenue: 0, orderCount: 0, rowCount: 0 },
  daily: [],
  products: [],
  orders: [],
  statuses: [],
  imports: [],
};

async function loadShopee(from: string, to: string): Promise<ShopeeData> {
  try {
    const [summary, daily, products, orders, statuses, imports] =
      await Promise.all([
        getShopeeSummary(from, to),
        getShopeeDailyRevenue(from, to),
        getShopeeTopProducts(from, to),
        getShopeeOrders(from, to),
        getShopeeStatusBreakdown(from, to),
        listShopeeImports(),
      ]);
    return { summary, daily, products, orders, statuses, imports };
  } catch {
    // DB unreachable / not configured — render empty tables rather than break.
    return EMPTY;
  }
}

/** Accept a YYYY-MM-DD param, falling back to `fallback` for anything else. */
function dayParam(raw: string | undefined, fallback: string): string {
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;
}

export default async function ShopeePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}) {
  const { from: fromParam, to: toParam, page: pageParam } = await searchParams;
  const thisMonth = monthRange(vnDayKey(new Date()));
  const from = dayParam(fromParam, thisMonth.from);
  const to = dayParam(toParam, thisMonth.to);

  const { summary, daily, products, orders, statuses, imports } =
    await loadShopee(from, to);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const page = parsePage(pageParam, totalPages);
  const pageOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = [
    { label: "Tổng doanh thu", value: formatVnd(summary.revenue) },
    { label: "Số đơn hàng", value: summary.orderCount.toLocaleString("vi-VN") },
    {
      label: "Số dòng sản phẩm",
      value: summary.rowCount.toLocaleString("vi-VN"),
    },
  ];

  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[#1D2939]">Shopee</h1>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-[#667085]">Home</span>
          <ChevronRight className="h-4 w-4 text-[#667085]" />
          <span className="text-[#1D2939]">Shopee</span>
        </div>
      </div>

      <div className="space-y-6">
        <ShopeeUpload />

        <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
          <div className="border-b border-[#E4E7EC] px-4 py-4 sm:px-5">
            <ShopeeDateFilter from={from} to={to} />
          </div>
          <div className="grid gap-px bg-[#E4E7EC] sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-white px-4 py-4 sm:px-5">
                <p className="text-sm text-[#667085]">{s.label}</p>
                <p className="mt-1 text-xl font-semibold text-[#1D2939] sm:text-2xl">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <p className="border-t border-[#E4E7EC] px-4 py-3 text-[13px] text-[#667085] sm:px-5">
            Doanh thu tính theo cột “Tổng số tiền người mua thanh toán”, gộp một
            lần cho mỗi mã đơn và không tính đơn đã hủy.
          </p>
        </div>

        <Card
          title="Doanh thu theo ngày"
          subtitle={`Từ ${formatDayKey(from)} đến ${formatDayKey(to)}.`}
        >
          {daily.length === 0 ? (
            <Empty>Chưa có dữ liệu trong khoảng ngày này.</Empty>
          ) : (
            <Table className="[&_td]:px-4 [&_th]:px-4 lg:[&_td]:px-5 lg:[&_th]:px-5">
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead className="text-right">Số đơn</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daily.map((d) => (
                  <TableRow key={d.date}>
                    <TableCell>{formatDayKey(d.date)}</TableCell>
                    <TableCell className="text-right">{d.orders}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatVnd(d.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card
          title="Sản phẩm bán chạy"
          subtitle="Tính theo giá ưu đãi × số lượng của từng dòng sản phẩm."
        >
          {products.length === 0 ? (
            <Empty>Chưa có dữ liệu trong khoảng ngày này.</Empty>
          ) : (
            <>
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Phân loại</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={`${p.productName}|${p.variantName}`}>
                        <TableCell className="max-w-[420px] truncate">
                          {p.productName || "—"}
                        </TableCell>
                        <TableCell className="text-[#667085]">
                          {p.variantName || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatVnd(p.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <MobileCardList>
                {products.map((p) => (
                  <MobileCard key={`m-${p.productName}|${p.variantName}`}>
                    <div>
                      <p className="text-sm font-semibold text-[#1D2939]">
                        {p.productName || "—"}
                      </p>
                      <p className="text-xs text-[#667085]">
                        {p.variantName || "—"}
                      </p>
                    </div>
                    <CardField label="Số lượng">{p.quantity}</CardField>
                    <CardField label="Doanh thu">
                      {formatVnd(p.revenue)}
                    </CardField>
                  </MobileCard>
                ))}
              </MobileCardList>
            </>
          )}
        </Card>

        <Card
          title="Danh sách đơn hàng"
          subtitle="Gồm cả đơn đã hủy, để đối chiếu với Shopee."
          footer={
            orders.length > 0 ? (
              <Pagination
                pathname="/shopee"
                searchParams={{ from, to }}
                page={page}
                totalItems={orders.length}
              />
            ) : null
          }
        >
          {orders.length === 0 ? (
            <Empty>Chưa có đơn hàng trong khoảng ngày này.</Empty>
          ) : (
            <>
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn hàng</TableHead>
                      <TableHead>Ngày đặt</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-right">
                        Người mua trả
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageOrders.map((o) => (
                      <TableRow key={o.orderCode}>
                        <TableCell className="font-medium">
                          {o.orderCode}
                        </TableCell>
                        <TableCell>{formatDayKey(o.orderDayKey)}</TableCell>
                        <TableCell className="text-[#667085]">
                          {o.status || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {o.itemCount}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatVnd(o.buyerPaidTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <MobileCardList>
                {pageOrders.map((o) => (
                  <MobileCard key={`m-${o.orderCode}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-[#1D2939]">
                        {o.orderCode}
                      </span>
                      <span className="text-xs text-[#667085]">
                        {formatDayKey(o.orderDayKey)}
                      </span>
                    </div>
                    <CardField label="Trạng thái">{o.status || "—"}</CardField>
                    <CardField label="Số lượng">{o.itemCount}</CardField>
                    <CardField label="Người mua trả">
                      {formatVnd(o.buyerPaidTotal)}
                    </CardField>
                  </MobileCard>
                ))}
              </MobileCardList>
            </>
          )}
        </Card>

        <Card
          title="Phân loại theo trạng thái"
          subtitle="Dùng để kiểm tra đơn hủy có được loại khỏi doanh thu đúng hay chưa."
        >
          {statuses.length === 0 ? (
            <Empty>Chưa có dữ liệu trong khoảng ngày này.</Empty>
          ) : (
            <Table className="[&_td]:px-4 [&_th]:px-4 lg:[&_td]:px-5 lg:[&_th]:px-5">
              <TableHeader>
                <TableRow>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Số đơn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((s) => (
                  <TableRow key={s.status}>
                    <TableCell>{s.status || "—"}</TableCell>
                    <TableCell className="text-right">{s.orders}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card
          title="Lịch sử nhập tệp"
          subtitle="Tệp gốc không được lưu lại — chỉ giữ dữ liệu đã đọc."
        >
          {imports.length === 0 ? (
            <Empty>Chưa nhập tệp nào.</Empty>
          ) : (
            <>
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên tệp</TableHead>
                      <TableHead>Khoảng ngày</TableHead>
                      <TableHead className="text-right">Số dòng</TableHead>
                      <TableHead className="text-right">Số đơn</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead className="text-right">Đã thay thế</TableHead>
                      <TableHead>Thời điểm nhập</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.map((im) => (
                      <TableRow key={im._id}>
                        <TableCell className="font-medium">
                          {im.filename}
                        </TableCell>
                        <TableCell>
                          {formatDayKey(im.rangeFrom)} →{" "}
                          {formatDayKey(im.rangeTo)}
                        </TableCell>
                        <TableCell className="text-right">
                          {im.rowCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {im.orderCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatVnd(im.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right text-[#667085]">
                          {im.replacedRowCount}
                        </TableCell>
                        <TableCell className="text-[#667085]">
                          {new Date(im.importedAt).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteShopeeImportButton
                            id={im._id}
                            filename={im.filename}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <MobileCardList>
                {imports.map((im) => (
                  <MobileCard key={`m-${im._id}`}>
                    <div>
                      <p className="text-sm font-semibold break-all text-[#1D2939]">
                        {im.filename}
                      </p>
                      <p className="text-xs text-[#667085]">
                        {formatDayKey(im.rangeFrom)} →{" "}
                        {formatDayKey(im.rangeTo)}
                      </p>
                    </div>
                    <CardField label="Số dòng">{im.rowCount}</CardField>
                    <CardField label="Số đơn">{im.orderCount}</CardField>
                    <CardField label="Doanh thu">
                      {formatVnd(im.totalRevenue)}
                    </CardField>
                    <CardField label="Đã thay thế">
                      {im.replacedRowCount}
                    </CardField>
                    <CardField label="Thời điểm nhập">
                      {new Date(im.importedAt).toLocaleString("vi-VN")}
                    </CardField>
                    <div className="flex justify-end pt-1">
                      <DeleteShopeeImportButton
                        id={im._id}
                        filename={im.filename}
                      />
                    </div>
                  </MobileCard>
                ))}
              </MobileCardList>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
      <div className="border-b border-[#E4E7EC] px-5 py-4">
        <h3 className="text-lg font-semibold text-[#1D2939]">{title}</h3>
        <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>
      </div>
      {children}
      {footer}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-[#667085]">{children}</p>
  );
}
