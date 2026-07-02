import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingWidgets } from "@/components/FloatingWidgets";
import { ProductCarousel } from "@/components/ProductCarousel";
import { Breadcrumb } from "@/components/pdp/Breadcrumb";
import { ProductDetail } from "@/components/pdp/ProductDetail";
import { ProductDescription } from "@/components/pdp/ProductDescription";
import { ProductReviews } from "@/components/pdp/ProductReviews";
import { SimilarProducts } from "@/components/pdp/SimilarProducts";
import { pdpProduct, teeProducts } from "@/lib/products";

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
