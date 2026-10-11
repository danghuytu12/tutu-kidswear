import { NextResponse } from "next/server";
import {
  deleteOrder,
  getOrderById,
  transitionOrderStatus,
} from "@repo/ui/lib/db/repositories/orders";
import {
  reserveStockForOrder,
  restoreStockForOrder,
} from "@repo/ui/lib/db/repositories/inventory";
import {
  sendOrderDeletedToTelegram,
  sendOrderStatusToTelegram,
} from "@repo/ui/lib/notify/telegram";
import {
  ORDER_STATUSES,
  shortageMessage,
  type OrderDoc,
} from "@repo/ui/lib/db/types";
import { requireSession } from "@/lib/require-session";
import { releaseStockOnDelete } from "@/lib/order-stock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidStatus(v: unknown): v is OrderDoc["status"] {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = (await request.json()) as { status?: unknown };
    if (!isValidStatus(body.status)) {
      return NextResponse.json(
        { error: "Trạng thái không hợp lệ" },
        { status: 400 },
      );
    }
    const before = await getOrderById(id);
    if (!before) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }
    if (before.status === body.status) return NextResponse.json({ order: before });

    // Compare-and-swap on the status we just read, so the stock side effect
    // below runs exactly once even if two admins change the order together.
    const order = await transitionOrderStatus(id, before.status, body.status);
    if (!order) {
      return NextResponse.json(
        { error: "Đơn hàng vừa được cập nhật ở nơi khác, vui lòng tải lại." },
        { status: 409 },
      );
    }

    // Stock follows the cancelled boundary: cancelling gives the units back,
    // un-cancelling takes them again (and is refused if they're gone).
    if (body.status === "cancelled") {
      await restoreStockForOrder(order.items, id, "cancel");
    } else if (before.status === "cancelled") {
      const reserved = await reserveStockForOrder(order.items, id, "recancel");
      if (!reserved.ok) {
        await transitionOrderStatus(id, body.status, "cancelled");
        return NextResponse.json(
          { error: shortageMessage(reserved.shortages) },
          { status: 409 },
        );
      }
    }

    // Best-effort Telegram notification; never blocks the response on failure.
    await sendOrderStatusToTelegram(order, before.status);
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật đơn hàng" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    // Fetch the order first so the notification has its details after deletion.
    const order = await getOrderById(id);
    const deleted = await deleteOrder(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }
    if (order) {
      await releaseStockOnDelete(order);
      await sendOrderDeletedToTelegram(order);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa đơn hàng" },
      { status: 500 },
    );
  }
}
