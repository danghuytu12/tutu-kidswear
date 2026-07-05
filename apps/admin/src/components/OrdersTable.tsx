"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { OrderDoc } from "@repo/ui/lib/db/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";
import { DeleteOrderButton } from "@/components/DeleteOrderButton";
import { PaymentProofCell } from "@/components/PaymentProofCell";

const COLUMNS = [
  "Mã đơn",
  "Khách hàng",
  "Sản phẩm",
  "Địa chỉ",
  "Thanh toán",
  "Biên lai",
  "Trạng thái",
  "Tổng tiền",
  "Ngày đặt",
  "Thao tác",
];

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

function orderCode(id: string): string {
  return `#${id}`;
}

function fullAddress(o: OrderDoc): string {
  return [o.address, o.ward, o.district, o.province].filter(Boolean).join(", ");
}

export function OrdersTable({
  orders,
  query,
}: {
  orders: OrderDoc[];
  query: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const someSelected = selected.size > 0;

  function toggleOne(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((cur) =>
      cur.size === orders.length ? new Set() : new Set(orders.map((o) => o._id)),
    );
  }

  async function deleteSelected() {
    if (busy || selected.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) throw new Error("bulk delete failed");
      setSelected(new Set());
      setConfirmOpen(false);
      router.refresh();
    } catch {
      window.alert("Không thể xóa các đơn hàng. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Bulk action bar — shown once at least one order is selected. */}
      {someSelected ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#E4E7EC] bg-[#F9FAFB] px-5 py-3">
          <span className="text-sm text-[#344054]">
            Đã chọn <strong>{selected.size}</strong> đơn hàng
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm text-[#667085] hover:text-[#344054]"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#B42318] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#912018]"
            >
              <Trash2 className="h-4 w-4" />
              Xóa đã chọn
            </button>
          </div>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow className="border-[#E4E7EC] hover:bg-transparent">
            <TableHead className="w-10">
              <input
                type="checkbox"
                aria-label="Chọn tất cả đơn hàng"
                checked={allSelected}
                onChange={toggleAll}
                disabled={orders.length === 0}
                className="h-4 w-4 cursor-pointer rounded border-[#D0D5DD] text-[#465FFF] focus:ring-[#465FFF]/30"
              />
            </TableHead>
            {COLUMNS.map((label) => (
              <TableHead key={label} className="text-[#344054]">
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={COLUMNS.length + 1} className="py-16 text-center">
                <p className="text-sm text-[#667085]">
                  {query
                    ? `Không tìm thấy đơn hàng nào khớp "${query}".`
                    : "Chưa có đơn hàng nào."}
                </p>
              </TableCell>
            </TableRow>
          ) : null}
          {orders.map((o) => {
            const isSel = selected.has(o._id);
            return (
              <TableRow
                key={o._id}
                data-state={isSel ? "selected" : undefined}
                className="border-[#E4E7EC] hover:bg-gray-50 data-[state=selected]:bg-[#EEF4FF]"
              >
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Chọn đơn ${orderCode(o._id)}`}
                    checked={isSel}
                    onChange={() => toggleOne(o._id)}
                    className="h-4 w-4 cursor-pointer rounded border-[#D0D5DD] text-[#465FFF] focus:ring-[#465FFF]/30"
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-mono text-sm font-medium text-[#344054]">
                    {orderCode(o._id)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#344054]">
                      {o.customerName}
                    </span>
                    <span className="text-xs text-[#667085]">{o.customerPhone}</span>
                    {o.customerEmail ? (
                      <span className="text-xs text-[#667085]">{o.customerEmail}</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="min-w-[260px]">
                  <ul className="space-y-2">
                    {o.items.map((it, i) => (
                      <li key={`${o._id}-${i}`} className="flex items-center gap-2.5">
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
                          {[it.size, it.color].some(Boolean) ? (
                            <span className="ml-1 rounded bg-[#F2F4F7] px-1.5 py-0.5 text-xs text-[#475467]">
                              {[it.size, it.color].filter(Boolean).join(" · ")}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {o.note ? (
                    <p className="mt-1 text-xs italic text-[#98A2B3]">
                      Ghi chú: {o.note}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <span className="block max-w-[220px] text-sm text-[#667085]">
                    {fullAddress(o)}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="text-sm text-[#667085]">
                    {o.paymentMethod === "qr" ? "Chuyển khoản QR" : "COD"}
                  </span>
                </TableCell>
                <TableCell>
                  <PaymentProofCell proof={o.paymentProof} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <OrderStatusSelect id={o._id} status={o.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="text-sm font-medium text-[#344054]">
                    {formatVnd(o.total)}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="text-sm text-[#667085]">
                    {formatDate(o.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <DeleteOrderButton id={o._id} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selected.size} đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Các đơn hàng đã chọn sẽ bị xóa
              vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void deleteSelected();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy ? "Đang xóa…" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
