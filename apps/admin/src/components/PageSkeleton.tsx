import { Skeleton } from "@repo/ui/components/ui/skeleton";

/**
 * Loading placeholders for the admin pages.
 *
 * Each preset mirrors the real page's frame — same card chrome, same
 * desktop-table / mobile-card split as the loaded views — so content swaps in
 * without the layout jumping.
 */

function PageHeading() {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-5 w-36" />
    </div>
  );
}

function CardHeader() {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-[#E4E7EC] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-11 w-full sm:w-64" />
    </div>
  );
}

/** Table rows on large screens, stacked cards below — matching the real pages. */
function TableBody({ rows, columns }: { rows: number; columns: number }) {
  const rowKeys = Array.from({ length: rows }, (_, i) => i);
  const colKeys = Array.from({ length: columns }, (_, i) => i);

  return (
    <>
      <div className="hidden lg:block">
        {rowKeys.map((row) => (
          <div
            key={row}
            className="flex items-center gap-5 border-b border-[#E4E7EC] px-5 py-4"
          >
            {colKeys.map((col) => (
              <Skeleton
                key={col}
                className={col === 0 ? "h-10 flex-[2]" : "h-4 flex-1"}
              />
            ))}
          </div>
        ))}
      </div>

      <ul className="divide-y divide-[#E4E7EC] lg:hidden">
        {rowKeys.map((row) => (
          <li key={row} className="space-y-3 px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 flex-none" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            {colKeys.slice(1).map((col) => (
              <div key={col} className="flex items-center justify-between gap-3">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}

function Footer() {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E4E7EC] px-4 py-4 sm:flex-row sm:px-5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-48" />
    </div>
  );
}

/** A list page: heading, card chrome, then table/card rows. */
export function TablePageSkeleton({
  rows = 8,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <PageHeading />
      <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
        <CardHeader />
        <TableBody rows={rows} columns={columns} />
        <Footer />
      </div>
    </div>
  );
}

/** The dashboard: filter row, four stat cards, then a chart block. */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <PageHeading />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <Skeleton key={card} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-80 w-full rounded-xl" />
    </div>
  );
}

/** The Shopee report: upload card, filter + stat tiles, then report tables. */
export function ShopeeSkeleton() {
  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <PageHeading />
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
          <div className="border-b border-[#E4E7EC] px-4 py-4 sm:px-5">
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="grid gap-px bg-[#E4E7EC] sm:grid-cols-3">
            {[0, 1, 2].map((tile) => (
              <div key={tile} className="space-y-2 bg-white px-4 py-4 sm:px-5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-32" />
              </div>
            ))}
          </div>
        </div>
        {[0, 1].map((card) => (
          <div
            key={card}
            className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white"
          >
            <CardHeader />
            <TableBody rows={4} columns={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The product form: two stacked section cards plus the action row. */
export function FormPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <PageHeading />
      <div className="space-y-6">
        {[0, 1].map((section) => (
          <div
            key={section}
            className="space-y-5 rounded-xl border border-[#E4E7EC] bg-white p-5"
          >
            <Skeleton className="h-6 w-56" />
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((field) => (
                <div key={field} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-3">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-36" />
        </div>
      </div>
    </div>
  );
}
