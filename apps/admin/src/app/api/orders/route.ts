import { NextResponse } from "next/server";
import {
  listOrders,
  deleteOrders,
  getOrderById,
} from "@repo/ui/lib/db/repositories/orders";
import { sendOrderDeletedToTelegram } from "@repo/ui/lib/notify/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}

/** Bulk-delete orders. Body: { ids: string[] }. Returns { deleted: number }. */
export async function DELETE(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((v): v is string => typeof v === "string")
      : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "Không có đơn hàng nào được chọn" }, { status: 400 });
    }
    // Fetch each order's details before deletion so the Telegram notifications
    // (sent after the delete succeeds) still have full info to report.
    const orders = await Promise.all(ids.map((id) => getOrderById(id)));
    const deleted = await deleteOrders(ids);
    // Best-effort Telegram notification per removed order; failures never block
    // the response. Mirrors the single-order DELETE route behaviour.
    await Promise.all(
      orders
        .filter((order): order is NonNullable<typeof order> => order !== null)
        .map((order) =>
          sendOrderDeletedToTelegram(order).catch(() => undefined),
        ),
    );
    return NextResponse.json({ deleted });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete orders" },
      { status: 500 },
    );
  }
}
