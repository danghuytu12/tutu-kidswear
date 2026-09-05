import { cn } from "@repo/ui/lib/utils";

/**
 * Card primitives used to render table rows as a readable stack on phones.
 * Every list is `lg:hidden`; the matching `<table>` is wrapped in `hidden
 * lg:block` so exactly one of the two shows at any width.
 */

export function MobileCardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-[#E4E7EC] lg:hidden", className)}>
      {children}
    </ul>
  );
}

export function MobileCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={cn("space-y-3 px-4 py-4", className)}>{children}</li>;
}

export function CardField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-[#667085]">{label}</span>
      <span className="min-w-0 text-right font-medium text-[#344054]">
        {children}
      </span>
    </div>
  );
}

export function CardEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-12 text-center text-sm text-[#667085] lg:hidden">
      {children}
    </p>
  );
}
