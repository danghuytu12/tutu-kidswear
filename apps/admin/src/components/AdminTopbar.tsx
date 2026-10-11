import Link from "next/link";
import { Search } from "lucide-react";
import { AdminPageTitle } from "@/components/AdminPageTitle";
import { NotificationBell } from "@/components/NotificationBell";
import { LogoutButton } from "@/components/LogoutButton";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-black/5 bg-white/90 px-4 backdrop-blur sm:gap-4 sm:px-6 lg:h-16">
      {/* Phones/tablets: logo + section title (navigation is the bottom tab bar). */}
      <Link href="/" className="flex shrink-0 items-center lg:hidden" aria-label="Tổng quan">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/cocandy/logo.png" alt="" className="h-9 w-auto" />
      </Link>
      <div className="min-w-0 flex-1 lg:hidden">
        <AdminPageTitle />
      </div>
      <div className="hidden flex-1 items-center gap-2 rounded-full bg-[#f2ece3] px-4 py-2 text-black/50 lg:flex">
        <Search className="h-4 w-4" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full max-w-xs bg-transparent text-[14px] text-black outline-none placeholder:text-black/40"
        />
      </div>
      <NotificationBell />
      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b08560] text-[13px] font-bold text-white lg:flex">
        CO
      </div>
      <div className="hidden lg:block">
        <LogoutButton />
      </div>
    </header>
  );
}
