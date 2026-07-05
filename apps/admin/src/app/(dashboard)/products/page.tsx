import Link from "next/link";
import {
  ChevronRight,
  ChevronsUpDown,
  Download,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { listProducts } from "@repo/ui/lib/db/repositories/products";
import type { ProductDoc } from "@repo/ui/lib/db/types";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { Pagination, PAGE_SIZE, parsePage } from "@/components/Pagination";

// Read live from the shared MongoDB; never cache at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  img: string;
  name: string;
  category: string;
  price: string;
  inStock: boolean;
  date: string;
};

// Format an ISO date -> "01 Dec, 2027" (matches the TailAdmin design).
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toRow(doc: ProductDoc): ProductRow {
  return {
    id: doc._id,
    img: doc.img,
    name: doc.name,
    category: doc.category,
    price: doc.sale,
    inStock: doc.inStock,
    date: formatDate(doc.createdAt),
  };
}

// Static demo rows — used as a fallback when the database is empty or unreachable
// so the page (and `next build`) never break.
const FALLBACK_PRODUCTS: ProductRow[] = [
  {
    id: "",
    img: "/images/tailadmin/product/product-03.jpg",
    name: "ASUS ROG Gaming Laptop",
    category: "Laptop",
    price: "$2,199",
    inStock: false,
    date: "01 Dec, 2027",
  },
  {
    id: "",
    img: "/images/tailadmin/product/product-01.jpg",
    name: "Airpods Pro 2nd Gen",
    category: "Accessories",
    price: "$839",
    inStock: true,
    date: "29 Jun, 2027",
  },
  {
    id: "",
    img: "/images/tailadmin/product/product-02.jpg",
    name: "Apple Watch Ultra",
    category: "Watch",
    price: "$1,579",
    inStock: false,
    date: "13 Mar, 2027",
  },
  {
    id: "",
    img: "/images/tailadmin/product/product-01.jpg",
    name: "Bose QuietComfort Earbuds",
    category: "Audio",
    price: "$279",
    inStock: true,
    date: "18 Nov, 2027",
  },
  {
    id: "",
    img: "/images/tailadmin/product/product-02.jpg",
    name: "Canon EOS R5 Camera",
    category: "Camera",
    price: "$3,899",
    inStock: true,
    date: "28 Sep, 2027",
  },
  {
    id: "",
    img: "/images/tailadmin/product/product-04.jpg",
    name: "Dell XPS 13 Laptop",
    category: "Laptop",
    price: "$1,299",
    inStock: true,
    date: "18 Aug, 2027",
  },
  {
    id: "",
    img: "/images/tailadmin/product/product-05.jpg",
    name: "Google Pixel 8 Pro",
    category: "Phone",
    price: "$899",
    inStock: false,
    date: "02 Sep, 2027",
  },
];

const SORTABLE_COLUMNS = [
  "Products",
  "Category",
  "Price",
  "Stock",
  "Created At",
] as const;

async function loadProducts(): Promise<ProductRow[]> {
  try {
    // An empty DB is a valid state: the admin starts empty and products are
    // created here. Return the real (possibly empty) list so the table shows
    // an empty state rather than fake demo rows.
    const docs = await listProducts();
    return docs.map(toRow);
  } catch {
    // DB unreachable / not configured — show demo rows so the page still renders.
    return FALLBACK_PRODUCTS;
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const products = await loadProducts();

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const page = parsePage(pageParam, totalPages);
  const pageProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <p className="text-sm text-[#667085]">
                      Chưa có sản phẩm nào. Nhấn{" "}
                      <span className="font-medium text-[#1D2939]">
                        + Add Product
                      </span>{" "}
                      để thêm sản phẩm đầu tiên.
                    </p>
                  </td>
                </tr>
              ) : null}
              {pageProducts.map((p) => (
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
                  <td className="px-5 py-4">
                    {p.id ? (
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/edit-product/${p.id}`}
                          aria-label="Edit product"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#465FFF]/10 hover:text-[#465FFF]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteProductButton id={p.id} />
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          pathname="/products"
          searchParams={{}}
          page={page}
          totalItems={products.length}
        />
      </div>
    </div>
  );
}
