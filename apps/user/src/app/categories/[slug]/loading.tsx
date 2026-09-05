import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { ProductCardSkeleton } from "@repo/ui/components/ProductCardSkeleton";

export default function Loading() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      {/* Breadcrumb */}
      <nav className="cocandy-container flex items-center gap-2 py-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-24" />
      </nav>

      <div className="cocandy-container py-6">
        {/* Sort row */}
        <div className="mb-6 flex items-center justify-end gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
