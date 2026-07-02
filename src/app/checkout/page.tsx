import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingWidgets } from "@/components/FloatingWidgets";
import { ProductGrid } from "@/components/ProductGrid";
import { CheckoutLayout } from "@/components/checkout/CheckoutLayout";
import { suggestedProducts } from "@/lib/products";

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
