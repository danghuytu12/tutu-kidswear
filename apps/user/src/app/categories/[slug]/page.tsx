import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { FloatingWidgets } from "@repo/ui/components/FloatingWidgets";
import { Breadcrumb } from "@/components/category/Breadcrumb";
import { CategoryLayout } from "@/components/category/CategoryLayout";
import {
  listProducts,
  toStorefrontProduct,
} from "@repo/ui/lib/db/repositories/products";
import { saleHeThuProducts } from "@repo/ui/lib/products";
import type { Product } from "@repo/ui/lib/types";

// Read the shared catalog from MongoDB at request time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadProducts(): Promise<Product[]> {
  try {
    const docs = await listProducts();
    if (docs.length === 0) return saleHeThuProducts;
    return docs.map(toStorefrontProduct);
  } catch {
    // DB unreachable / not configured — fall back to the static catalog.
    return saleHeThuProducts;
  }
}

export default async function CategoryPage() {
  const products = await loadProducts();

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <Breadcrumb />
      <CategoryLayout products={products} />
      <SiteFooter />
      <FloatingWidgets />
    </>
  );
}
