import { NextResponse } from "next/server";
import { listOrders, deleteOrders } from "@repo/ui/lib/db/repositories/orders";

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
    const deleted = await deleteOrders(ids);
    return NextResponse.json({ deleted });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete orders" },
      { status: 500 },
    );
  }
}
