import { NextResponse } from "next/server";
import {
  listUnreadOrders,
  countUnreadOrders,
} from "@repo/ui/lib/db/repositories/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [count, unread] = await Promise.all([
      countUnreadOrders(),
      listUnreadOrders(20),
    ]);
    // Safe subset only — never expose phone/email in notifications.
    const orders = unread.map((o) => ({
      _id: o._id,
      customerName: o.customerName,
      total: o.total,
      createdAt: o.createdAt,
    }));
    return NextResponse.json({ count, orders });
  } catch {
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}
