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
import { SITE } from "@repo/ui/lib/seo";
import type { Metadata } from "next";

// Read the shared catalog from MongoDB at request time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/** Human label + SEO copy per known category slug. */
const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  "be-trai": {
    title: "Thời trang bé trai – Quần áo cho bé trai",
    description:
      "Bộ sưu tập quần áo bé trai của Tutu Kidswear: áo, quần, bộ đồ trẻ em nam chất liệu thoáng mát, năng động, dễ thương. Đủ size, giao hàng toàn quốc.",
  },
  "be-gai": {
    title: "Thời trang bé gái – Quần áo cho bé gái",
    description:
      "Bộ sưu tập quần áo bé gái của Tutu Kidswear: váy, áo, bộ đồ trẻ em nữ đáng yêu, chất liệu an toàn, mềm mại. Đủ size, giao hàng toàn quốc.",
  },
};

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { slug } = await params;
  const seo = CATEGORY_SEO[slug];
  const path = `/categories/${slug}`;
  const title = seo?.title ?? "Danh mục sản phẩm";
  const description = seo?.description ?? SITE.description;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE.name}`,
      description,
      url: path,
      type: "website",
    },
  };
}

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
