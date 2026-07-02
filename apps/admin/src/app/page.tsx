import { Package, ShoppingBag, Users, TrendingUp } from "lucide-react";
import {
  newProducts,
  bestsellerProducts,
  swimProducts,
  teeProducts,
  mellowProducts,
  saleHeThuProducts,
} from "@repo/ui/lib/products";

const allProducts = [
  ...newProducts,
  ...bestsellerProducts,
  ...swimProducts,
  ...teeProducts,
  ...mellowProducts,
  ...saleHeThuProducts,
];
const uniqueProducts = new Set(allProducts.map((p) => p.href)).size;

const STATS = [
  { label: "Sản phẩm", value: String(uniqueProducts), icon: Package, tone: "#b08560" },
  { label: "Đơn hàng hôm nay", value: "0", icon: ShoppingBag, tone: "#c2864e" },
  { label: "Khách hàng", value: "0", icon: Users, tone: "#a67b5b" },
  { label: "Doanh thu", value: "0 ₫", icon: TrendingUp, tone: "#8a6647" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-[28px] font-bold text-black">Tổng quan</h1>
      <p className="mt-1 text-[14px] text-black/50">
        Bảng điều khiển quản trị cửa hàng COCANDY.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-black/50">{label}</span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: tone }}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 font-display text-[26px] font-bold text-black">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-display text-[18px] font-bold text-black">
          Sản phẩm mới nhất
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-black/10 text-[12px] uppercase text-black/40">
                <th className="pb-2 font-medium">Sản phẩm</th>
                <th className="pb-2 font-medium">Giá bán</th>
                <th className="pb-2 font-medium">Giá gốc</th>
                <th className="pb-2 font-medium">Giảm</th>
              </tr>
            </thead>
            <tbody>
              {newProducts.slice(0, 6).map((p) => (
                <tr key={p.href} className="border-b border-black/5">
                  <td className="py-2.5 text-black">{p.name}</td>
                  <td className="py-2.5 font-semibold text-[#c2864e]">{p.sale}</td>
                  <td className="py-2.5 text-black/40 line-through">{p.orig}</td>
                  <td className="py-2.5 text-[#dc2525]">{p.disc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
