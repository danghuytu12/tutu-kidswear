import type { Product } from "@repo/ui/lib/types";
import { ProductCard } from "@repo/ui/components/ProductCard";
import { cn } from "@repo/ui/lib/utils";
import { StaggerGrid, StaggerItem } from "@repo/ui/components/motion";

interface ProductGridProps {
  title?: string;
  products: Product[];
  cols?: 3 | 4;
  hoverAdd?: boolean;
  className?: string;
}

export function ProductGrid({
  title,
  products,
  cols = 4,
  hoverAdd = true,
  className,
}: ProductGridProps) {
  return (
    <section className={cn("cocandy-container py-8", className)}>
      {title && (
        <h2 className="font-display mb-6 text-[24px] font-bold uppercase tracking-wide text-black">
          {title}
        </h2>
      )}
      <StaggerGrid
        className={cn(
          "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3",
          cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {products.map((p) => (
          <StaggerItem key={p.href + p.name}>
            <ProductCard product={p} hoverAdd={hoverAdd} />
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}
