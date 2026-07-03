import { ChevronRight } from "lucide-react";
import { listOrders } from "@repo/ui/lib/db/repositories/orders";
import type { OrderDoc } from "@repo/ui/lib/db/types";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";

// Read live from the shared MongoDB; never cache at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Format an ISO date -> "01 Dec, 2027, 14:05" (admin-facing).
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatVnd(price: number): string {
  return `${price.toLocaleString("vi-VN")} ₫`;
}

function fullAddress(o: OrderDoc): string {
  return [o.address, o.ward, o.district, o.province].filter(Boolean).join(", ");
}

async function loadOrders(): Promise<OrderDoc[]> {
  try {
    return await listOrders();
  } catch {
    // DB unreachable / not configured — render an empty table rather than break.
    return [];
  }
}

export default async function OrdersPage() {
  const orders = await loadOrders();

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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E4E7EC]">
                {["Khách hàng", "Sản phẩm", "Địa chỉ", "Thanh toán", "Trạng thái", "Tổng tiền", "Ngày đặt"].map(
                  (label) => (
                    <th key={label} className="px-5 py-4 text-left">
                      <span className="text-sm font-medium text-[#344054]">
                        {label}
                      </span>
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-sm text-[#667085]">Chưa có đơn hàng nào.</p>
                  </td>
                </tr>
              ) : null}
              {orders.map((o) => (
                <tr
                  key={o._id}
                  className="border-b border-[#E4E7EC] align-top transition hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#344054]">
                        {o.customerName}
                      </span>
                      <span className="text-xs text-[#667085]">
                        {o.customerPhone}
                      </span>
                      {o.customerEmail ? (
                        <span className="text-xs text-[#667085]">
                          {o.customerEmail}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <ul className="space-y-2">
                      {o.items.map((it, i) => (
                        <li
                          key={`${o._id}-${i}`}
                          className="flex items-center gap-2.5"
                        >
                          {it.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={it.img}
                              alt={it.name}
                              className="h-10 w-10 flex-none rounded-md object-cover"
                            />
                          ) : (
                            <span className="h-10 w-10 flex-none rounded-md bg-[#F2F4F7]" />
                          )}
                          <span className="text-sm text-[#667085]">
                            {it.name}{" "}
                            <span className="text-[#98A2B3]">×{it.qty}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {o.note ? (
                      <p className="mt-1 text-xs italic text-[#98A2B3]">
                        Ghi chú: {o.note}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <span className="block max-w-[220px] text-sm text-[#667085]">
                      {fullAddress(o)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#667085]">
                      {o.paymentMethod === "qr" ? "Chuyển khoản QR" : "COD"}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <OrderStatusSelect id={o._id} status={o.status} />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-[#344054]">
                      {formatVnd(o.total)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#667085]">
                      {formatDate(o.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#E4E7EC] px-5 py-4">
          <p className="text-sm text-[#667085]">
            {orders.length === 0
              ? "Showing 0 of 0"
              : `Showing 1 to ${orders.length} of ${orders.length}`}
          </p>
        </div>
      </div>
    </div>
  );
}
