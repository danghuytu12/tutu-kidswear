import type { Metadata } from "next";
import { Be_Vietnam_Pro, Baloo_2 } from "next/font/google";
import { CartProvider } from "@repo/ui/components/cart/CartContext";
import { ToastProvider } from "@repo/ui/components/ui/toast";
import "./globals.css";

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
  title: "Trang chủ | Tutu Kidswear",
  description: "Thời trang thiết kế cho bé",
  openGraph: {
    title: "Tutu Kidswear",
    description: "Thời trang thiết kế cho bé",
    siteName: "Tutu Kidswear",
    type: "website",
  },
  icons: {
    icon: "/seo/favicon.png",
  },
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
        <CartProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
