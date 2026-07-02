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
  swimProducts,
  teeProducts,
  saleHeThuProducts,
  mellowProducts,
} from "@repo/ui/lib/products";

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <HeroCarousel />
      <CategoryQuickLinks />
      <ProductTabsSection />
      <PromoBanner
        src="/images/cocandy/banner-1.png"
        href="/categories/bst-do-boi"
      />
      <ProductCarousel
        title="BST đồ bơi"
        products={swimProducts}
        moreHref="/categories/bst-do-boi"
      />
      <PromoBanner src="/images/cocandy/banner-2.png" href="/categories/bst" />
      <ProductCarousel
        title="BST ÁO THUN"
        products={teeProducts}
        moreHref="/categories/ao"
      />
      <ProductCarousel
        title="SALE HÈ THU"
        products={saleHeThuProducts.slice(0, 8)}
        moreHref="/categories/sale-he-thu"
      />
      <PromoBanner
        src="/images/cocandy/banner-3.png"
        href="/categories/bst-mellow-candy"
      />
      <ProductCarousel
        title="BST MELLOW CANDY"
        products={mellowProducts}
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
