import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FileSpreadsheet,
  Settings,
} from "lucide-react";

export const NAV = [
  { label: "Tổng quan", href: "/", icon: LayoutDashboard },
  { label: "Sản phẩm", href: "/products", icon: Package },
  { label: "Đơn hàng", href: "/orders", icon: ShoppingBag },
  { label: "Khách hàng", href: "/customers", icon: Users },
  { label: "Shopee", href: "/shopee", icon: FileSpreadsheet },
  { label: "Cài đặt", href: "/settings", icon: Settings },
] as const;

/** A nav item is active on its own route (and, except for "/", its subroutes). */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
