"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

const NAV = [
  { label: "Tổng quan", href: "/", icon: LayoutDashboard },
  { label: "Sản phẩm", href: "/products", icon: Package },
  { label: "Đơn hàng", href: "/orders", icon: ShoppingBag },
  { label: "Khách hàng", href: "/customers", icon: Users },
  { label: "Cài đặt", href: "/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/5 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-black/5 px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/cocandy/logo.png" alt="Tutu Kidswear" className="h-12 w-auto" />
        <span className="font-display text-[15px] font-bold text-[#b08560]">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors",
                active
                  ? "bg-[#b08560] text-white"
                  : "text-black/70 hover:bg-[#f2ece3] hover:text-[#b08560]",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-black/5 p-4 text-[12px] text-black/40">
        Tutu Kidswear © 2026
      </div>
    </aside>
  );
}
