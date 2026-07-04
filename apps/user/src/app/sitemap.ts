import type { MetadataRoute } from "next";
import { siteUrl } from "@repo/ui/lib/seo";
import { getCatalog } from "@/lib/catalog";

// Regenerate the sitemap at request time so new products appear without a
// rebuild. The MongoDB driver needs the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/categories/be-trai`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/categories/be-gai`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // One entry per product. On DB error getCatalog() returns [] — the sitemap
  // still lists the static routes rather than failing the whole response.
  const products = await getCatalog();
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}${p.href}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
