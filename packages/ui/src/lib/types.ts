// Content structure types for the cocandy.vn clone.

export interface Product {
  name: string;
  href: string;
  img: string;
  /** Sale (current) price, formatted e.g. "279.650 ₫" */
  sale: string;
  /** Original price before discount, formatted e.g. "329.000 ₫" (optional if no discount) */
  orig?: string;
  /** Discount label e.g. "(-15%)" */
  disc?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface MegaMenuGroup {
  title: string;
  links: NavLink[];
}

export interface MegaMenu {
  label: string;
  href: string;
  groups: MegaMenuGroup[];
}

export interface SizeOption {
  /** e.g. "66" */
  label: string;
  /** e.g. "5 - 8 kg" */
  weight: string;
}

export interface FooterColumn {
  title: string;
  links: string[];
}
