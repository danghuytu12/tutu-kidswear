import type { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";

interface ProductCarouselProps {
  title?: string;
  products: Product[];
  moreLabel?: string;
  moreHref?: string;
  topRightLabel?: string;
  topRightHref?: string;
  hoverAdd?: boolean;
}

export function ProductCarousel({
  title,
  products,
  moreLabel = "XEM THÊM",
  moreHref = "#",
  topRightLabel,
  topRightHref = "#",
  hoverAdd = true,
}: ProductCarouselProps) {
  return (
    <section className="cocandy-container py-8">
      {(title || topRightLabel) && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1" />
          {title && (
            <h2 className="font-display text-center text-[24px] font-bold uppercase tracking-wide text-black">
              {title}
            </h2>
          )}
          <div className="flex flex-1 justify-end">
            {topRightLabel && (
              <a
                href={topRightHref}
                className="text-[14px] text-[#a67b5b] hover:underline"
              >
                {topRightLabel}
              </a>
            )}
          </div>
        </div>
      )}

      <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
        {products.map((p) => (
          <div
            key={p.href + p.name}
            className="w-[calc(50%-8px)] shrink-0 snap-start sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]"
          >
            <ProductCard product={p} hoverAdd={hoverAdd} />
          </div>
        ))}
      </div>

      {moreLabel && (
        <div className="mt-6 flex justify-center">
          <a
            href={moreHref}
            className="rounded-full bg-[#b08560] px-8 py-2 text-[14px] text-white transition-colors hover:bg-[#8a6647]"
          >
            {moreLabel}
          </a>
        </div>
      )}
    </section>
  );
}
