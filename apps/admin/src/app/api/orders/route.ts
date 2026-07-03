import { NextResponse } from "next/server";
import { listOrders } from "@repo/ui/lib/db/repositories/orders";

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
