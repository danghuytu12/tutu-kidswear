// NOTE: server-only module — import only from Server Components / route handlers
// (it pulls in the MongoDB driver via the repositories).
import {
  listProducts,
  getProductByHref,
  toStorefrontProduct,
} from "@repo/ui/lib/db/repositories/products";
import type { ProductDoc } from "@repo/ui/lib/db/types";
import type { Product } from "@repo/ui/lib/types";

// Server-side catalog access for the storefront. Reads the shared DB (products
// created in admin). When the DB is empty or unreachable, callers fall back to
// the static curated arrays so the site never breaks.

/** All DB products as storefront Product[]. Empty array if none / on error. */
export async function getCatalog(): Promise<Product[]> {
  try {
    const docs = await listProducts();
    return docs.map(toStorefrontProduct);
  } catch {
    return [];
  }
}

/**
 * Pick `count` products from the catalog starting at `offset` (wraps around),
 * so different homepage sections show different slices instead of identical
 * lists. Falls back to `fallback` when the catalog is empty.
 */
export function slice(
  catalog: Product[],
  offset: number,
  count: number,
  fallback: Product[],
): Product[] {
  if (catalog.length === 0) return fallback;
  const out: Product[] = [];
  for (let i = 0; i < Math.min(count, catalog.length); i++) {
    out.push(catalog[(offset + i) % catalog.length]);
  }
  return out;
}

/** Full ProductDoc by href (for PDP). null if not found / on error. */
export async function getProductDocByHref(
  href: string,
): Promise<ProductDoc | null> {
  try {
    return await getProductByHref(href);
  } catch {
    return null;
  }
}
