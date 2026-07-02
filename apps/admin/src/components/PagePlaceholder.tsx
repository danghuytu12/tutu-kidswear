import type { ReactNode } from "react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

/** Empty scaffold shell for admin sections not yet built out. */
export function PagePlaceholder({
  title,
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-[28px] font-bold text-black">{title}</h1>
      <p className="mt-1 text-[14px] text-black/50">{description}</p>
      <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center">
        {children ?? (
          <p className="text-[15px] text-black/40">
            Khu vực này đang chờ được xây dựng.
          </p>
        )}
      </div>
    </div>
  );
}
