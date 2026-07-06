// NOTE: server-only module — import only from Server Components / route handlers
// (it pulls in the MongoDB driver via the repositories).
import {
  listProducts,
  getProductByHref,
  toStorefrontProduct,
} from "@repo/ui/lib/db/repositories/products";
import type { ProductDoc } from "@repo/ui/lib/db/types";
import type { Product, MegaMenu } from "@repo/ui/lib/types";
import { beTraiMenu, beGaiMenu } from "@repo/ui/lib/navigation";

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
 * The admin `category` value a product stores. Matches the CATEGORIES constant
 * in the admin product form.
 */
type AdminCategory = "Bé Trai" | "Bé Gái";

/**
 * Map every category slug (the `/categories/<slug>` page) to its top-level admin
 * category. Built from the nav menus: the parent slug (`be-trai`) plus every
 * sub-category link under it (`ao-coc-tay-1`, …) all resolve to "Bé Trai";
 * likewise for "Bé Gái". Slugs not present here (e.g. `bst`, `outlet`) have no
 * mapping and show the full catalog.
 */
function buildSlugCategoryMap(): Map<string, AdminCategory> {
  const map = new Map<string, AdminCategory>();
  const addMenu = (menu: MegaMenu, category: AdminCategory) => {
    const slugOf = (href: string) => href.replace(/^\/categories\//, "");
    map.set(slugOf(menu.href), category);
    for (const group of menu.groups) {
      for (const link of group.links) {
        map.set(slugOf(link.href), category);
      }
    }
  };
  addMenu(beTraiMenu, "Bé Trai");
  addMenu(beGaiMenu, "Bé Gái");
  return map;
}

const SLUG_CATEGORY = buildSlugCategoryMap();

/** The admin category a category-page slug belongs to, or null if unmapped. */
export function categoryForSlug(slug: string): AdminCategory | null {
  return SLUG_CATEGORY.get(slug) ?? null;
}

/**
 * DB products for a category-page slug, as storefront Product[]. When the slug
 * maps to an admin category ("Bé Trai"/"Bé Gái") the catalog is filtered to that
 * category; unmapped slugs return the full catalog. Products not flagged in
 * admin as "Sản phẩm mới" (isNew) or "Sản phẩm bán chạy" (isBestSeller) are
 * excluded so they never surface in the bé trai / bé gái filters. Empty array
 * if none / on error, so callers can fall back to a static list.
 */
export async function getCatalogByCategory(slug: string): Promise<Product[]> {
  try {
    const docs = await listProducts();
    const category = categoryForSlug(slug);
    const filtered = docs
      .filter((d) => d.isNew || d.isBestSeller)
      .filter((d) => (category ? d.category === category : true));
    return filtered.map(toStorefrontProduct);
  } catch {
    return [];
  }
}

/**
 * DB products flagged as "sản phẩm mới" (isNew), as storefront Product[],
 * newest first (listProducts already sorts by createdAt desc). Empty array if
 * none / on error, so callers can fall back to a static list.
 */
export async function getNewProducts(): Promise<Product[]> {
  try {
    const docs = await listProducts();
    return docs.filter((d) => d.isNew).map(toStorefrontProduct);
  } catch {
    return [];
  }
}

/**
 * DB products flagged as "sản phẩm bán chạy" (isBestSeller), as storefront
 * Product[]. Empty array if none / on error, so callers can fall back to a
 * static list.
 */
export async function getBestSellerProducts(): Promise<Product[]> {
  try {
    const docs = await listProducts();
    return docs.filter((d) => d.isBestSeller).map(toStorefrontProduct);
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
