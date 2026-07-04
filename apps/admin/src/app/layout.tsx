import type { Metadata } from "next";
import { Be_Vietnam_Pro, Baloo_2, Outfit } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// TailAdmin-cloned pages (products list / add product) use Outfit.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const baloo2 = Baloo_2({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tutu Kidswear Admin",
  description: "Bảng quản trị Tutu Kidswear",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${baloo2.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f7f4ef] text-black">{children}</body>
    </html>
  );
}
