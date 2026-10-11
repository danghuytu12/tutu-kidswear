"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Spinner } from "@repo/ui/components/Spinner";

/**
 * Search box for the orders table. Debounces input and reflects it in the `?q=`
 * URL param; the orders page (a Server Component) reads that param and queries
 * the DB. Searches by order code / customer name / phone.
 */
export function OrderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  // Debounce: push the query into the URL 400ms after the user stops typing.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      // Inside a transition so `pending` covers the server round-trip, not just
      // the URL swap.
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    }, 400);
    return () => clearTimeout(id);
  }, [value, searchParams, pathname, router]);

  return (
    <div className="flex h-11 w-full items-center gap-2 rounded-full border border-[#E4E7EC] bg-white pl-4 pr-1.5 focus-within:border-[#b08560]/50 sm:h-10 sm:w-80">
      {pending ? (
        <Spinner className="shrink-0 text-[#667085]" />
      ) : (
        <Search className="h-4 w-4 shrink-0 text-[#667085]" />
      )}
      <input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Tìm đơn hàng"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tìm mã đơn, tên khách, SĐT..."
        className="w-full bg-transparent text-[14px] text-[#1D2939] outline-none placeholder:text-[#98A2B3] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          aria-label="Xóa tìm kiếm"
          onClick={() => setValue("")}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#667085] hover:bg-[#F2F4F7] active:bg-[#F2F4F7]"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
