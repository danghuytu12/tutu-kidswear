import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { FloatingWidgets } from "@repo/ui/components/FloatingWidgets";
import { ProductGrid } from "@repo/ui/components/ProductGrid";
import { CheckoutLayout } from "@/components/checkout/CheckoutLayout";
import { suggestedProducts } from "@repo/ui/lib/products";

export default function CheckoutPage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <CheckoutLayout />
      <ProductGrid
        title="CÓ THỂ BẠN SẼ THÍCH"
        products={suggestedProducts}
        cols={4}
      />
      <SiteFooter />
      <FloatingWidgets />
    </>
  );
}
