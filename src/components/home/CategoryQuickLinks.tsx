import { quickCategoryTiles } from "@/lib/navigation";

export function CategoryQuickLinks() {
  return (
    <section className="cocandy-container py-6">
      <div className="no-scrollbar flex gap-4 overflow-x-auto">
        {quickCategoryTiles.map((t) => (
          <a key={t.href} href={t.href} className="w-28 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.img}
              alt={t.name}
              loading="lazy"
              className="mx-auto h-24 w-24 rounded-full object-cover ring-1 ring-black/5"
            />
            <p className="mt-2 line-clamp-2 text-center text-[12px] text-black">
              {t.name}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
