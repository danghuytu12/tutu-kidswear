import { Fragment } from "react";

const CRUMBS = ["Trang chủ", "DM_KHAC", "Xả Kho", "Sale Hè Thu"];

export function Breadcrumb() {
  return (
    <nav className="cocandy-container py-4 text-[14px] text-black/70">
      {CRUMBS.map((crumb, i) => {
        const isLast = i === CRUMBS.length - 1;
        return (
          <Fragment key={crumb}>
            {i > 0 && <span> / </span>}
            {isLast ? (
              <span>{crumb}</span>
            ) : (
              <a href="#" className="hover:text-black">
                {crumb}
              </a>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
