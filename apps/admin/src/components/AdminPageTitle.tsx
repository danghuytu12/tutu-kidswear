"use client";

import { usePathname } from "next/navigation";
import { NAV, isActive } from "@/components/admin-nav";

/** Current section name for the compact phone topbar. */
export function AdminPageTitle() {
  const pathname = usePathname();
  const item = NAV.find((n) => isActive(pathname, n.href));
  return (
    <span className="truncate text-[17px] font-semibold text-[#1D2939]">
      {item?.label ?? "Quản trị"}
    </span>
  );
}
