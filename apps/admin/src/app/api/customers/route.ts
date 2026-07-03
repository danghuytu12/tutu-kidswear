import { NextResponse } from "next/server";
import { listCustomers } from "@repo/ui/lib/db/repositories/customers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const customers = await listCustomers();
    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json(
      { error: "Failed to load customers" },
      { status: 500 },
    );
  }
}
