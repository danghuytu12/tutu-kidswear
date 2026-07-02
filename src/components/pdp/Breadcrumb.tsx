interface BreadcrumbProps {
  items: string[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="cocandy-container py-4 text-[14px]">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item + i}>
            {isLast ? (
              <span className="text-black/70">{item}</span>
            ) : (
              <a href="#" className="text-black/70 hover:underline">
                {item}
              </a>
            )}
            {!isLast && <span className="mx-2 text-[#c4c4c4]">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
