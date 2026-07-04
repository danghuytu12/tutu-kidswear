import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { FloatingWidgets } from "@repo/ui/components/FloatingWidgets";
import { ProductGrid } from "@repo/ui/components/ProductGrid";
import { CheckoutLayout } from "@/components/checkout/CheckoutLayout";
import { suggestedProducts } from "@repo/ui/lib/products";
import { getCatalog, slice } from "@/lib/catalog";
import type { Metadata } from "next";

// Suggested products come from the shared DB at request time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Transactional page — keep it out of the search index.
export const metadata: Metadata = {
  title: "Thanh toán",
  robots: { index: false, follow: true },
};

export default async function CheckoutPage() {
  const catalog = await getCatalog();
  const suggested = slice(catalog, 0, 8, suggestedProducts);

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <CheckoutLayout />
      <ProductGrid
        title="CÓ THỂ BẠN SẼ THÍCH"
        products={suggested}
        cols={4}
      />
      <SiteFooter />
      <FloatingWidgets />
    </>
  );
}
