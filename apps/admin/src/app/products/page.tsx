import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

type ProductRow = {
  img: string;
  name: string;
  category: string;
  brand: string;
  price: string;
  inStock: boolean;
  date: string;
};

const PRODUCTS: ProductRow[] = [
  {
    img: "/images/tailadmin/product/product-03.jpg",
    name: "ASUS ROG Gaming Laptop",
    category: "Laptop",
    brand: "ASUS",
    price: "$2,199",
    inStock: false,
    date: "01 Dec, 2027",
  },
  {
    img: "/images/tailadmin/product/product-01.jpg",
    name: "Airpods Pro 2nd Gen",
    category: "Accessories",
    brand: "Apple",
    price: "$839",
    inStock: true,
    date: "29 Jun, 2027",
  },
  {
    img: "/images/tailadmin/product/product-02.jpg",
    name: "Apple Watch Ultra",
    category: "Watch",
    brand: "Apple",
    price: "$1,579",
    inStock: false,
    date: "13 Mar, 2027",
  },
  {
    img: "/images/tailadmin/product/product-01.jpg",
    name: "Bose QuietComfort Earbuds",
    category: "Audio",
    brand: "Bose",
    price: "$279",
    inStock: true,
    date: "18 Nov, 2027",
  },
  {
    img: "/images/tailadmin/product/product-02.jpg",
    name: "Canon EOS R5 Camera",
    category: "Camera",
    brand: "Canon",
    price: "$3,899",
    inStock: true,
    date: "28 Sep, 2027",
  },
  {
    img: "/images/tailadmin/product/product-04.jpg",
    name: "Dell XPS 13 Laptop",
    category: "Laptop",
    brand: "Dell",
    price: "$1,299",
    inStock: true,
    date: "18 Aug, 2027",
  },
  {
    img: "/images/tailadmin/product/product-05.jpg",
    name: "Google Pixel 8 Pro",
    category: "Phone",
    brand: "Google",
    price: "$899",
    inStock: false,
    date: "02 Sep, 2027",
  },
];

const SORTABLE_COLUMNS = [
  "Products",
  "Category",
  "Brand",
  "Price",
  "Stock",
  "Created At",
] as const;

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-[1536px] font-[family-name:var(--font-outfit)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-[#1D2939]">Products</h1>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-[#667085]">Home</span>
          <ChevronRight className="h-4 w-4 text-[#667085]" />
          <span className="text-[#1D2939]">Products</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
        <div className="flex flex-col justify-between gap-5 border-b border-[#E4E7EC] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-[#1D2939]">
              Products List
            </h3>
            <p className="mt-1 text-sm text-[#667085]">
              Track your store&apos;s progress to boost your sales.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-medium text-[#344054] ring-1 ring-inset ring-[#D0D5DD] transition hover:bg-gray-50"
            >
              Export
              <Download className="h-4 w-4" />
            </button>
            <Link
              href="/add-product"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#465FFF] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#3641F5]"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search..."
              className="h-11 w-full rounded-lg border border-[#E4E7EC] bg-transparent py-2.5 pl-12 pr-4 text-sm text-[#1D2939] placeholder:text-[#98A2B3] focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/10 xl:w-[430px]"
            />
          </div>
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-4 py-2.5 text-sm font-medium text-[#344054] shadow-sm sm:min-w-[100px]"
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E4E7EC]">
                <th className="w-12 px-5 py-4 text-left">
                  <span className="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] border-[#D0D5DD] bg-transparent" />
                </th>
                {SORTABLE_COLUMNS.map((label) => (
                  <th key={label} className="px-5 py-4 text-left">
                    <span className="inline-flex cursor-pointer select-none items-center gap-1 text-sm font-medium text-[#344054]">
                      {label}
                      <ChevronsUpDown className="h-3.5 w-3.5 text-[#98A2B3]" />
                    </span>
                  </th>
                ))}
                <th className="px-5 py-4 text-left">
                  <span className="text-sm font-medium text-[#344054]">
                    Action
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p) => (
                <tr
                  key={`${p.name}-${p.date}`}
                  className="border-b border-[#E4E7EC] transition hover:bg-gray-50"
                >
                  <td className="w-12 px-5 py-4 whitespace-nowrap">
                    <span className="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] border-[#D0D5DD] bg-transparent" />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.img}
                        alt={p.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                      <span className="text-sm font-medium text-[#344054]">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#667085]">{p.category}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#667085]">{p.brand}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#344054]">{p.price}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={
                        p.inStock
                          ? "inline-flex rounded-full bg-[#ECFDF3] px-2 py-0.5 text-xs font-medium text-[#027A48]"
                          : "inline-flex rounded-full bg-[#FEF3F2] px-2 py-0.5 text-xs font-medium text-[#B42318]"
                      }
                    >
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#344054]">{p.date}</span>
                  </td>
                  <td className="px-5 py-4" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E4E7EC] px-5 py-4 sm:flex-row">
          <p className="text-sm text-[#667085]">Showing 1 to 7 of 20</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center rounded-lg border border-[#D0D5DD] bg-white p-2 text-[#344054] shadow-sm transition hover:bg-gray-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#465FFF] text-sm font-medium text-white"
            >
              1
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-[#344054] transition hover:bg-[#465FFF]/10"
            >
              2
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-[#344054] transition hover:bg-[#465FFF]/10"
            >
              3
            </button>
            <button
              type="button"
              className="flex items-center rounded-lg border border-[#D0D5DD] bg-white p-2 text-[#344054] shadow-sm transition hover:bg-gray-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
