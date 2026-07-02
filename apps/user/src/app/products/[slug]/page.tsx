import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { FloatingWidgets } from "@repo/ui/components/FloatingWidgets";
import { ProductCarousel } from "@repo/ui/components/ProductCarousel";
import { Breadcrumb } from "@/components/pdp/Breadcrumb";
import { ProductDetail } from "@/components/pdp/ProductDetail";
import { ProductDescription } from "@/components/pdp/ProductDescription";
import { ProductReviews } from "@/components/pdp/ProductReviews";
import { SimilarProducts } from "@/components/pdp/SimilarProducts";
import { pdpProduct, teeProducts } from "@repo/ui/lib/products";

export default function ProductPage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <Breadcrumb items={pdpProduct.breadcrumb} />
      <ProductDetail />
      <ProductDescription />
      <ProductCarousel title="GỢI Ý SẢN PHẨM" products={teeProducts} moreLabel="" />
      <ProductReviews />
      <SimilarProducts />
      <SiteFooter />
      <FloatingWidgets />
    </>
  );
}
