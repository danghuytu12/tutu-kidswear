import { NextResponse } from "next/server";
import { listProducts } from "@repo/ui/lib/db/repositories/products";

// Read-only product feed for the storefront.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}
