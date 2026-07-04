import type { MetadataRoute } from "next";
import { siteUrl } from "@repo/ui/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep transactional / API paths out of the index.
        disallow: ["/checkout", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
