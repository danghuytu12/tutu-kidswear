import { NextResponse } from "next/server";
import {
  deleteOrder,
  getOrderById,
  updateOrderStatus,
} from "@repo/ui/lib/db/repositories/orders";
import {
  sendOrderDeletedToTelegram,
  sendOrderStatusToTelegram,
} from "@repo/ui/lib/notify/telegram";
import { ORDER_STATUSES, type OrderDoc } from "@repo/ui/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidStatus(v: unknown): v is OrderDoc["status"] {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { status?: unknown };
    if (!isValidStatus(body.status)) {
      return NextResponse.json(
        { error: "Trạng thái không hợp lệ" },
        { status: 400 },
      );
    }
    // Capture the previous status before updating so the notification can show
    // the transition (from → to).
    const before = await getOrderById(id);
    const order = await updateOrderStatus(id, body.status);
    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }
    // Best-effort Telegram notification; never blocks the response on failure.
    if (before && before.status !== order.status) {
      await sendOrderStatusToTelegram(order, before.status);
    }
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật đơn hàng" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
