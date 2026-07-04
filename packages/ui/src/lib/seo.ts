// Central SEO configuration + structured-data (JSON-LD) builders for the
// storefront. Keeping brand facts and the canonical base URL in one place means
// every page, the sitemap, and the JSON-LD all agree.

/** Canonical brand facts. Single source of truth for titles, JSON-LD, etc. */
export const SITE = {
  name: "Tutu Kidswear",
  /** Short brand slug used in titles. */
  shortName: "Tutu Kidswear",
  /** Marketing description — kept keyword-rich but human-readable. */
  description:
    "Tutu Kidswear – thời trang trẻ em thiết kế cho bé trai và bé gái. Quần áo trẻ em chất liệu an toàn, mềm mại, thoáng mát, kiểu dáng dễ thương, năng động. Giao hàng toàn quốc, đổi trả trong 15 ngày.",
  /** Vietnamese-market keyword set for the home page. */
  keywords: [
    "thời trang trẻ em",
    "quần áo trẻ em",
    "đồ trẻ em",
    "quần áo bé trai",
    "quần áo bé gái",
    "thời trang bé trai",
    "thời trang bé gái",
    "đồ bé trai",
    "đồ bé gái",
    "shop quần áo trẻ em",
    "Tutu Kidswear",
  ],
  hotline: "0834494182",
  locale: "vi_VN",
} as const;

/**
 * The site's canonical origin (no trailing slash). Reads NEXT_PUBLIC_SITE_URL so
 * previews/staging can override it; defaults to the production domain.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://tutukidswear.vn";
  return raw.replace(/\/+$/, "");
}

/** Build an absolute URL from a site-relative path (e.g. "/products/x"). */
export function absoluteUrl(path: string): string {
  const base = siteUrl();
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

/** The share image (Open Graph / Twitter). Uses the existing logo asset. */
export const OG_IMAGE = {
  url: "/images/cocandy/logo.png",
  width: 790,
  height: 1018,
  alt: SITE.name,
} as const;

/**
 * Organization + WebSite + Store JSON-LD for the whole site. Rendered once in
 * the root layout so Google and AI crawlers can identify the brand, its logo,
 * contact channel, and the search action.
 */
export function organizationJsonLd(): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "Store"],
        "@id": `${base}/#organization`,
        name: SITE.name,
        url: base,
        logo: absoluteUrl(OG_IMAGE.url),
        image: absoluteUrl(OG_IMAGE.url),
        description: SITE.description,
        telephone: SITE.hotline,
        areaServed: "VN",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: SITE.hotline,
          contactType: "customer service",
          areaServed: "VN",
          availableLanguage: ["Vietnamese"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "vi-VN",
        publisher: { "@id": `${base}/#organization` },
      },
    ],
  };
}

/** A product for the Product JSON-LD builder (subset of the storefront shape). */
export interface ProductJsonLdInput {
  name: string;
  description?: string;
  /** Absolute or site-relative image URLs. */
  images: string[];
  /** Site-relative product path, e.g. "/products/ao-thun". */
  href: string;
  /** Numeric selling price in VND. */
  price: number;
  inStock: boolean;
  category?: string;
}

/** Product JSON-LD (schema.org/Product + Offer) for a product detail page. */
export function productJsonLd(p: ProductJsonLdInput): Record<string, unknown> {
  const base = siteUrl();
  const url = absoluteUrl(p.href);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description || SITE.description,
    image: p.images.map((src) =>
      src.startsWith("http") ? src : absoluteUrl(src),
    ),
    url,
    category: p.category || "Thời trang trẻ em",
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "VND",
      price: p.price,
      availability: p.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@id": `${base}/#organization` },
    },
  };
}

// Named HTML entities the TinyMCE editor commonly emits for Vietnamese text.
// (Vowels with diacritics are encoded as Latin-1 named entities.)
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  agrave: "à",
  aacute: "á",
  acirc: "â",
  atilde: "ã",
  egrave: "è",
  eacute: "é",
  ecirc: "ê",
  igrave: "ì",
  iacute: "í",
  ograve: "ò",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  ugrave: "ù",
  uacute: "ú",
  yacute: "ý",
  Agrave: "À",
  Aacute: "Á",
  Egrave: "È",
  Eacute: "É",
  Igrave: "Ì",
  Ograve: "Ò",
  Oacute: "Ó",
  Ugrave: "Ù",
};

/**
 * Decode HTML entities (named + numeric) to their characters. Unknown named
 * entities are dropped. Used to turn editor HTML into clean plain text for meta
 * descriptions and JSON-LD — which must never contain markup or raw entities.
 */
export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (whole, name: string) =>
      name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : whole,
    );
}

/**
 * Turn editor HTML into a clean, clamped plain-text excerpt: strip tags, decode
 * entities, collapse whitespace, and clamp to `max` chars with an ellipsis.
 * Returns `fallback` when the input is empty.
 */
export function plainTextExcerpt(
  html: string | undefined,
  max: number,
  fallback: string,
): string {
  if (!html) return fallback;
  const text = decodeHtmlEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** BreadcrumbList JSON-LD from an ordered list of {name, href} crumbs. */
export function breadcrumbJsonLd(
  crumbs: { name: string; href: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.href),
    })),
  };
}
