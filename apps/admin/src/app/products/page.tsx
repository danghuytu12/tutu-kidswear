import {
  newProducts,
  bestsellerProducts,
  swimProducts,
  teeProducts,
  mellowProducts,
  saleHeThuProducts,
} from "@repo/ui/lib/products";
import type { Product } from "@repo/ui/lib/types";

// Deduplicated catalog across all homepage/category collections.
const catalog: Product[] = Object.values(
  [
    ...newProducts,
    ...bestsellerProducts,
    ...swimProducts,
    ...teeProducts,
    ...mellowProducts,
    ...saleHeThuProducts,
  ].reduce<Record<string, Product>>((acc, p) => {
    acc[p.href] = p;
    return acc;
  }, {}),
);

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold text-black">
            Sản phẩm
          </h1>
          <p className="mt-1 text-[14px] text-black/50">
            {catalog.length} sản phẩm trong cửa hàng.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[#b08560] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#8a6647]"
        >
          + Thêm sản phẩm
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-black/10 text-[12px] uppercase text-black/40">
              <th className="px-4 py-3 font-medium">Ảnh</th>
              <th className="px-4 py-3 font-medium">Tên sản phẩm</th>
              <th className="px-4 py-3 font-medium">Giá bán</th>
              <th className="px-4 py-3 font-medium">Giá gốc</th>
              <th className="px-4 py-3 font-medium">Giảm</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((p) => (
              <tr key={p.href} className="border-b border-black/5 hover:bg-[#faf7f2]">
                <td className="px-4 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                </td>
                <td className="px-4 py-2 text-black">{p.name}</td>
                <td className="px-4 py-2 font-semibold text-[#c2864e]">{p.sale}</td>
                <td className="px-4 py-2 text-black/40 line-through">{p.orig}</td>
                <td className="px-4 py-2 text-[#dc2525]">{p.disc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
