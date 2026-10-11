import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FileSpreadsheet,
  Settings,
  Warehouse,
} from "lucide-react";

export const NAV = [
  { label: "Tổng quan", href: "/", icon: LayoutDashboard },
  { label: "Sản phẩm", href: "/products", icon: Package },
  { label: "Kho hàng", href: "/inventory", icon: Warehouse },
  { label: "Đơn hàng", href: "/orders", icon: ShoppingBag },
  { label: "Khách hàng", href: "/customers", icon: Users },
  { label: "Shopee", href: "/shopee", icon: FileSpreadsheet },
  { label: "Cài đặt", href: "/settings", icon: Settings },
] as const;

// Routes that belong to a nav item without sharing its URL prefix.
const RELATED: Record<string, string[]> = {
  "/products": ["/add-product", "/edit-product"],
};

/** A nav item is active on its own route (and, except for "/", its subroutes). */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return [href, ...(RELATED[href] ?? [])].some((p) => pathname.startsWith(p));
}

/** Phone bottom tabs, in thumb-priority order; the rest live under "Thêm". */
export const MOBILE_TABS = ["/", "/orders", "/products", "/inventory"] as const;
