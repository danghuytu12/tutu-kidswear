import { NextResponse } from "next/server";
import {
  listProducts,
  toStorefrontProduct,
} from "@repo/ui/lib/db/repositories/products";

// Read-only product feed for the storefront.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const docs = await listProducts();
    // Reduced to the public shape: the stored document also carries cost price
    // and the per-channel selling prices, none of which may leave the admin.
    const products = docs.map(toStorefrontProduct);
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}
