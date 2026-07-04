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
import { JsonLd } from "@repo/ui/components/JsonLd";
import {
  SITE,
  productJsonLd,
  breadcrumbJsonLd,
  plainTextExcerpt,
} from "@repo/ui/lib/seo";
import type { Metadata } from "next";

// Look up the product by slug in the shared DB at request time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/** Image gallery for a product doc: the images array, or [img], or []. */
function galleryOf(doc: { images?: string[]; img?: string }): string[] {
  if (doc.images && doc.images.length > 0) return doc.images;
  return doc.img ? [doc.img] : [];
}

/** Product meta/JSON-LD description from editor HTML (falls back to SITE copy). */
function productExcerpt(html: string | undefined, max = 160): string {
  return plainTextExcerpt(html, max, SITE.description);
}

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getProductDocByHref(`/products/${slug}`);
  if (!doc) {
    return { title: "Sản phẩm" };
  }
  const path = `/products/${slug}`;
  const description = productExcerpt(doc.description);
  const images = galleryOf(doc);
  return {
    title: doc.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${doc.name} | ${SITE.name}`,
      description,
      url: path,
      type: "website",
      images: images.length > 0 ? images : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${doc.name} | ${SITE.name}`,
      description,
      images: images.length > 0 ? images : undefined,
    },
  };
}

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
        gallery: galleryOf(doc).length > 0 ? galleryOf(doc) : undefined,
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
      {doc ? (
        <>
          <JsonLd
            data={productJsonLd({
              name: doc.name,
              // Plain-text excerpt — JSON-LD must not carry raw HTML markup.
              description: productExcerpt(doc.description, 300),
              images: galleryOf(doc),
              href: doc.href,
              price: doc.price,
              inStock: doc.inStock,
              category: doc.category,
            })}
          />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: "Trang chủ", href: "/" },
              { name: doc.name, href: doc.href },
            ])}
          />
        </>
      ) : null}
      <AnnouncementBar />
      <SiteHeader />
      <Breadcrumb items={breadcrumb} />
      <ProductDetail data={data} />
      <ProductDescription html={data?.description} />
      <ProductCarousel title="GỢI Ý SẢN PHẨM" products={similar} moreLabel="" />
      {/* <ProductReviews /> */}
      {/* <SimilarProducts /> */}
      <SiteFooter />
      <FloatingWidgets />
    </>
  );
}
