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
import { formatVnd } from "@repo/ui/lib/cart";
import type { ProductDoc } from "@repo/ui/lib/db/types";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { Pagination, PAGE_SIZE, parsePage } from "@/components/Pagination";
import {
  CardEmpty,
  CardField,
  MobileCard,
  MobileCardList,
} from "@/components/MobileCard";

// Read live from the shared MongoDB; never cache at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  img: string;
  name: string;
  category: string;
  /** Formatted VND prices; "—" where the product has none recorded yet. */
  prices: {
    buy: string;
    facebook: string;
    shopee: string;
    tiktok: string;
  };
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

/** Older products predate the cost/channel prices, so a blank shows as a dash. */
function priceText(value: number | undefined): string {
  return typeof value === "number" ? formatVnd(value) : "—";
}

function toRow(doc: ProductDoc): ProductRow {
  return {
    id: doc._id,
    img: doc.img,
    name: doc.name,
    category: doc.category,
    prices: {
      buy: priceText(doc.buyPrice),
      facebook: priceText(doc.facebookPrice),
      shopee: priceText(doc.shopeePrice),
      tiktok: priceText(doc.tiktokPrice),
    },
    inStock: doc.inStock,
    date: formatDate(doc.createdAt),
  };
}

/** Price rows rendered in both the desktop cell and the mobile card. */
const PRICE_ROWS = [
  { label: "Nhập", key: "buy" },
  { label: "FB", key: "facebook" },
  { label: "Shopee", key: "shopee" },
  { label: "TikTok", key: "tiktok" },
] as const satisfies readonly {
  label: string;
  key: keyof ProductRow["prices"];
}[];

const SORTABLE_COLUMNS = [
  "Products",
  "Category",
  "Giá",
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
    // DB unreachable / not configured — render the empty state rather than break.
    return [];
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-medium text-[#344054] ring-1 ring-inset ring-[#D0D5DD] transition hover:bg-gray-50 sm:w-auto"
            >
              Export
              <Download className="h-4 w-4" />
            </button>
            <Link
              href="/add-product"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#465FFF] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#3641F5] sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search..."
              className="h-11 w-full rounded-lg border border-[#E4E7EC] bg-transparent py-2.5 pl-12 pr-4 text-sm text-[#1D2939] placeholder:text-[#98A2B3] focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/10 xl:w-[430px]"
            />
          </div>
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-4 py-2.5 text-sm font-medium text-[#344054] shadow-sm sm:w-auto sm:min-w-[100px]"
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filter
          </button>
        </div>

        <div className="hidden overflow-x-auto lg:block">
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
                    <dl className="space-y-0.5 text-xs">
                      {PRICE_ROWS.map(({ label, key }) => (
                        <div key={key} className="flex items-baseline gap-3">
                          <dt className="w-14 shrink-0 text-[#667085]">
                            {label}
                          </dt>
                          <dd className="flex-1 text-right font-medium text-[#344054]">
                            {p.prices[key]}
                          </dd>
                        </div>
                      ))}
                    </dl>
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

        {products.length === 0 ? (
          <CardEmpty>
            Chưa có sản phẩm nào. Nhấn{" "}
            <span className="font-medium text-[#1D2939]">+ Add Product</span> để
            thêm sản phẩm đầu tiên.
          </CardEmpty>
        ) : (
          <MobileCardList>
            {pageProducts.map((p) => (
              <MobileCard key={`m-${p.name}-${p.date}`}>
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-14 w-14 flex-none rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1D2939]">
                      {p.name}
                    </p>
                    <span
                      className={
                        p.inStock
                          ? "mt-1 inline-flex rounded-full bg-[#ECFDF3] px-2 py-0.5 text-xs font-medium text-[#027A48]"
                          : "mt-1 inline-flex rounded-full bg-[#FEF3F2] px-2 py-0.5 text-xs font-medium text-[#B42318]"
                      }
                    >
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>

                <CardField label="Category">{p.category}</CardField>
                {PRICE_ROWS.map(({ label, key }) => (
                  <CardField key={key} label={`Giá ${label}`}>
                    {p.prices[key]}
                  </CardField>
                ))}
                <CardField label="Date">{p.date}</CardField>

                {p.id ? (
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/edit-product/${p.id}`}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#D0D5DD] text-sm font-medium text-[#344054] transition hover:bg-gray-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Sửa
                    </Link>
                    <DeleteProductButton
                      id={p.id}
                      className="h-10 w-10 border border-[#FDA29B] text-[#B42318]"
                    />
                  </div>
                ) : null}
              </MobileCard>
            ))}
          </MobileCardList>
        )}

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
