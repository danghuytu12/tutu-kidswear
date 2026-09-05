import { NextResponse } from "next/server";
import {
  listProducts,
  createProduct,
} from "@repo/ui/lib/db/repositories/products";
import type { ProductInput } from "@repo/ui/lib/db/types";
import { requireSession } from "@/lib/require-session";

// The MongoDB driver needs the Node.js runtime, and results must not be cached at
// build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

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

export async function POST(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as ProductInput;
    const product = await createProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
