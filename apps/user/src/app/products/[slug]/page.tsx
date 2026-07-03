import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { FloatingWidgets } from "@repo/ui/components/FloatingWidgets";
import { ProductCarousel } from "@repo/ui/components/ProductCarousel";
import { Breadcrumb } from "@/components/pdp/Breadcrumb";
import {
  ProductDetail,
  type ProductDetailData,
} from "@/components/pdp/ProductDetail";
import { ProductDescription } from "@/components/pdp/ProductDescription";
import { ProductReviews } from "@/components/pdp/ProductReviews";
import { SimilarProducts } from "@/components/pdp/SimilarProducts";
import { pdpProduct, teeProducts } from "@repo/ui/lib/products";
import { getProductDocByHref, getCatalog, slice } from "@/lib/catalog";

// Look up the product by slug in the shared DB at request time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const doc = await getProductDocByHref(`/products/${slug}`);

  // Build detail overrides from the DB product (rich fields like sizes/reviews
  // still come from the static pdpProduct inside ProductDetail).
  const data: ProductDetailData | undefined = doc
    ? {
        name: doc.name,
        sale: doc.sale,
        orig: doc.orig,
        href: doc.href,
        // DB stores disc like "(-15%)" — strip to "15%" for the badge.
        discPct: doc.disc?.replace(/[^\d%]/g, "") || undefined,
        gallery:
          doc.images && doc.images.length > 0
            ? doc.images
            : doc.img
              ? [doc.img]
              : undefined,
        // Distinct sizes/colours from variants (preserve order, drop blanks).
        sizes: doc.variants?.length
          ? [...new Set(doc.variants.map((v) => v.size).filter(Boolean))]
          : undefined,
        colors: doc.variants?.length
          ? [...new Set(doc.variants.map((v) => v.color).filter(Boolean))]
          : undefined,
        description: doc.description || undefined,
        sizeChartImage: doc.sizeChartImage || undefined,
      }
    : undefined;

  const breadcrumb = doc
    ? ["Trang chủ", "Sản phẩm", doc.name]
    : pdpProduct.breadcrumb;

  // Similar products from the catalog (fallback to static tee list).
  const catalog = await getCatalog();
  const similar = slice(catalog, 0, 8, teeProducts);

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <Breadcrumb items={breadcrumb} />
      <ProductDetail data={data} />
      <ProductDescription html={data?.description} />
      <ProductCarousel title="GỢI Ý SẢN PHẨM" products={similar} moreLabel="" />
      <ProductReviews />
      <SimilarProducts />
      <SiteFooter />
      <FloatingWidgets />
    </>
  );
}
