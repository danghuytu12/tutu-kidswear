import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { ProductCardSkeleton } from "@repo/ui/components/ProductCardSkeleton";

/**
 * Header and footer render for real here — they are client components backed by
 * localStorage, not server data — so the chrome stays put and the cart and menu
 * keep working while the page below streams in.
 */
export default function Loading() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      {/* Hero carousel */}
      <Skeleton className="aspect-[2/1] max-h-[660px] w-full rounded-none" />

      <section className="cocandy-container py-8">
        {/* "Sản phẩm mới" / "Bán chạy" tabs */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <Skeleton className="h-7 w-44" />
          <span className="h-6 w-px bg-black/20" />
          <Skeleton className="h-7 w-44" />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
