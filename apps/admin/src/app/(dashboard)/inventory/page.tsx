import { listProducts } from "@repo/ui/lib/db/repositories/products";
import { listStockMovements } from "@repo/ui/lib/db/repositories/inventory";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  isPublished,
  isStockTracked,
  type ProductDoc,
  type StockMovementDoc,
} from "@repo/ui/lib/db/types";
import {
  InventoryClient,
  type InventoryProduct,
} from "@/components/InventoryClient";

// Read live from the shared MongoDB; never cache at build time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toInventoryProduct(doc: ProductDoc): InventoryProduct {
  return {
    id: doc._id,
    name: doc.name,
    img: doc.img,
    published: isPublished(doc),
    variants: (doc.variants ?? []).map((v) => ({
      color: v.color,
      size: v.size,
      stock: isStockTracked(v) ? (v.stock ?? 0) : null,
      threshold: v.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
    })),
  };
}

async function load(): Promise<{
  products: InventoryProduct[];
  movements: StockMovementDoc[];
}> {
  try {
    const [docs, movements] = await Promise.all([
      listProducts(),
      listStockMovements(100),
    ]);
    return { products: docs.map(toInventoryProduct), movements };
  } catch {
    // DB unreachable / not configured — render the empty state rather than break.
    return { products: [], movements: [] };
  }
}

export default async function InventoryPage() {
  const { products, movements } = await load();
  return (
    <div className="mx-auto max-w-[1536px]">
      <div className="mb-6 hidden items-center justify-between sm:flex">
        <h1 className="text-xl font-semibold text-[#1D2939]">Kho hàng</h1>
        <p className="text-sm text-[#667085]">
          Tồn kho theo từng màu · size, nhập kho và kiểm kê.
        </p>
      </div>
      <InventoryClient products={products} movements={movements} />
    </div>
  );
}
