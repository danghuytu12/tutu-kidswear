import type { Metadata } from "next";
import { Be_Vietnam_Pro, Baloo_2 } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CartProvider } from "@repo/ui/components/cart/CartContext";
import { ToastProvider } from "@repo/ui/components/ui/toast";
import { JsonLd } from "@repo/ui/components/JsonLd";
import {
  SITE,
  siteUrl,
  OG_IMAGE,
  organizationJsonLd,
} from "@repo/ui/lib/seo";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Body font — excellent Vietnamese diacritic support, geometric like the target's "font moi"
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Display/heading font — rounded, friendly, matches cocandy's Pangea-style nav & headings
const baloo2 = Baloo_2({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Tutu Kidswear – Thời trang trẻ em cho bé trai & bé gái",
    template: "%s | Tutu Kidswear",
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "shopping",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tutu Kidswear – Thời trang trẻ em cho bé trai & bé gái",
    description: SITE.description,
    url: siteUrl(),
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
    images: [
      {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutu Kidswear – Thời trang trẻ em cho bé trai & bé gái",
    description: SITE.description,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/seo/favicon.png",
  },
  // Fill in after registering the site in Google Search Console:
  // verification: { google: "your-verification-code" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${baloo2.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        <JsonLd data={organizationJsonLd()} />
        <CartProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartProvider>
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      </body>
    </html>
  );
}
