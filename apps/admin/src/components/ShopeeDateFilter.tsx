"use client";

import { useRouter } from "next/navigation";
import { addDays, monthRange, vnDayKey } from "@repo/ui/lib/date/vn";

/**
 * Date-range filter for the Shopee report.
 *
 * Writes ?from=&to= rather than holding state, so the range survives a reload,
 * stays shareable, and lets the server component aggregate directly instead of
 * needing a second API endpoint.
 */
export function ShopeeDateFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams({ from: nextFrom, to: nextTo });
    router.replace(`/shopee?${params.toString()}`);
  }

  const today = vnDayKey(new Date());
  const thisMonth = monthRange(today);
  // Day 0 of this month is the last day of the previous one.
  const prevMonth = monthRange(addDays(thisMonth.from, -1));

  const presets = [
    { label: "Tháng này", range: thisMonth },
    { label: "Tháng trước", range: prevMonth },
    { label: "30 ngày", range: { from: addDays(today, -29), to: today } },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = from === p.range.from && to === p.range.to;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => apply(p.range.from, p.range.to)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                active
                  ? "bg-[#465FFF] text-white"
                  : "bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="text-[#667085]">Từ</span>
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => apply(e.target.value, to)}
          className="min-w-0 flex-1 rounded-lg border border-[#D0D5DD] px-2.5 py-1.5 text-[#1D2939] outline-none focus:border-[#465FFF] sm:flex-none"
        />
        <span className="text-[#667085]">đến</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => apply(from, e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-[#D0D5DD] px-2.5 py-1.5 text-[#1D2939] outline-none focus:border-[#465FFF] sm:flex-none"
        />
      </div>
    </div>
  );
}
