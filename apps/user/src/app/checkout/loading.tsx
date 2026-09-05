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

      <div className="cocandy-container grid gap-10 py-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Delivery form */}
        <div>
          <Skeleton className="h-8 w-64" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i}>
                <Skeleton className="mb-1 h-4 w-28" />
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-5 h-14 w-full rounded-full" />
        </div>

        {/* Cart summary */}
        <div>
          <Skeleton className="h-8 w-40" />
          <div className="mt-4 divide-y divide-black/5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-14 w-14 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-6 w-full" />
        </div>
      </div>

      <section className="cocandy-container py-8">
        <Skeleton className="mb-6 h-7 w-72" />
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
