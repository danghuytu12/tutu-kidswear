import { AnnouncementBar } from "@repo/ui/components/AnnouncementBar";
import { SiteHeader } from "@repo/ui/components/SiteHeader";
import { SiteFooter } from "@repo/ui/components/SiteFooter";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { ProductCardSkeleton } from "@repo/ui/components/ProductCardSkeleton";

/** One label plus a row of choice pills — colours and sizes share this shape. */
function OptionRowSkeleton() {
  return (
    <div className="mt-6">
      <Skeleton className="h-3.5 w-24" />
      <div className="mt-2 flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      <nav className="cocandy-container flex items-center gap-2 py-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-40" />
      </nav>

      <section className="cocandy-container grid gap-8 pb-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded" />
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="mt-2 h-8 w-3/4" />
          <Skeleton className="mt-3 h-7 w-32" />

          <OptionRowSkeleton />
          <OptionRowSkeleton />

          <Skeleton className="mt-6 h-10 w-28 rounded-full" />

          <div className="mt-6 flex gap-3">
            <Skeleton className="h-12 flex-1 rounded" />
            <Skeleton className="h-12 flex-1 rounded" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cocandy-container py-8">
        <Skeleton className="mx-auto mb-6 h-7 w-56" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
