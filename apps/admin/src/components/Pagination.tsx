import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 10;

/** Clamp a raw ?page= value to a valid 1-based page number. */
export function parsePage(raw: string | undefined, totalPages: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, Math.max(totalPages, 1));
}

/** Which page numbers to render: always 1 and last, current ±1, gaps as "…". */
function pageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("ellipsis");
  items.push(total);
  return items;
}

/**
 * Build an href for a given page while preserving all other current query
 * params (e.g. the orders `?q=` search). `pathname` is the page's own path.
 */
function hrefFor(
  pathname: string,
  searchParams: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key !== "page" && value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function Pagination({
  pathname,
  searchParams,
  page,
  totalItems,
  pageSize = PAGE_SIZE,
}: {
  pathname: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  totalItems: number;
  pageSize?: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const arrowBase =
    "flex items-center rounded-lg border border-[#D0D5DD] bg-white p-2 shadow-sm transition";
  const arrowEnabled = "text-[#344054] hover:bg-gray-50";
  const arrowDisabled = "pointer-events-none text-[#D0D5DD] opacity-60";

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E4E7EC] px-5 py-4 sm:flex-row">
      <p className="text-sm text-[#667085]">
        {totalItems === 0
          ? "Showing 0 of 0"
          : `Showing ${from} to ${to} of ${totalItems}`}
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <Link
            href={hrefFor(pathname, searchParams, page - 1)}
            aria-label="Trang trước"
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={`${arrowBase} ${page <= 1 ? arrowDisabled : arrowEnabled}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          {pageItems(page, totalPages).map((item, i) =>
            item === "ellipsis" ? (
              <span
                key={`e${i}`}
                className="flex h-10 w-10 items-center justify-center text-sm text-[#98A2B3]"
              >
                …
              </span>
            ) : (
              <Link
                key={item}
                href={hrefFor(pathname, searchParams, item)}
                aria-current={item === page ? "page" : undefined}
                className={
                  item === page
                    ? "flex h-10 w-10 items-center justify-center rounded-lg bg-[#465FFF] text-sm font-medium text-white"
                    : "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-[#344054] transition hover:bg-[#465FFF]/10"
                }
              >
                {item}
              </Link>
            ),
          )}

          <Link
            href={hrefFor(pathname, searchParams, page + 1)}
            aria-label="Trang sau"
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
            className={`${arrowBase} ${page >= totalPages ? arrowDisabled : arrowEnabled}`}
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
