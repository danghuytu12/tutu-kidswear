import { Search } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-black/5 bg-white/80 px-6 backdrop-blur">
      <div className="flex flex-1 items-center gap-2 rounded-full bg-[#f2ece3] px-4 py-2 text-black/50">
        <Search className="h-4 w-4" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full max-w-xs bg-transparent text-[14px] text-black outline-none placeholder:text-black/40"
        />
      </div>
      <NotificationBell />
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b08560] text-[13px] font-bold text-white">
        CO
      </div>
    </header>
  );
}
