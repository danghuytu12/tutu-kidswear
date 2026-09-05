import { Skeleton } from "@repo/ui/components/ui/skeleton";

/**
 * Placeholder matching ProductCard's frame: a square image, up to two lines of
 * name (it is `line-clamp-2`), then the price row.
 */
export function ProductCardSkeleton() {
  return (
    <div className="block">
      <Skeleton className="aspect-square w-full rounded-md" />
      <Skeleton className="mt-2 h-[18px] w-full" />
      <Skeleton className="mt-1 h-[18px] w-2/3" />
      <div className="mt-1 flex items-baseline gap-x-1.5">
        <Skeleton className="h-[18px] w-[72px]" />
        <Skeleton className="h-[16px] w-10" />
      </div>
    </div>
  );
}
