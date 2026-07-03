import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { FloatingWidgets } from "@repo/ui/components/FloatingWidgets";
import { ProductCarousel } from "@repo/ui/components/ProductCarousel";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryQuickLinks } from "@/components/home/CategoryQuickLinks";
import { ProductTabsSection } from "@/components/home/ProductTabsSection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import {
  newProducts,
  bestsellerProducts,
  swimProducts,
  teeProducts,
  saleHeThuProducts,
  mellowProducts,
} from "@repo/ui/lib/products";
import { getCatalog, slice } from "@/lib/catalog";

// Read the shared catalog (products created in admin) at request time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  // One DB read; different slices feed each section. Empty DB → static arrays.
  const catalog = await getCatalog();

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <HeroCarousel />
      <CategoryQuickLinks />
      <ProductTabsSection
        newList={slice(catalog, 0, 8, newProducts)}
        bestList={slice(catalog, 8, 8, bestsellerProducts)}
      />
      <PromoBanner
        src="/images/cocandy/banner-1.png"
        href="/categories/bst-do-boi"
      />
      <ProductCarousel
        title="BST đồ bơi"
        products={slice(catalog, 16, 8, swimProducts)}
        moreHref="/categories/bst-do-boi"
      />
      <PromoBanner src="/images/cocandy/banner-2.png" href="/categories/bst" />
      <ProductCarousel
        title="BST ÁO THUN"
        products={slice(catalog, 24, 8, teeProducts)}
        moreHref="/categories/ao"
      />
      <ProductCarousel
        title="SALE HÈ THU"
        products={slice(catalog, 32, 8, saleHeThuProducts.slice(0, 8))}
        moreHref="/categories/sale-he-thu"
      />
      <PromoBanner
        src="/images/cocandy/banner-3.png"
        href="/categories/bst-mellow-candy"
      />
      <ProductCarousel
        title="BST MELLOW CANDY"
        products={slice(catalog, 40, 8, mellowProducts)}
        topRightLabel="Xem thêm"
        topRightHref="/categories/bst-mellow-candy"
        moreHref="/categories/bst-mellow-candy"
      />
      <RecentlyViewed />
      <SiteFooter />
      <FloatingWidgets />
    </>
  );
}
