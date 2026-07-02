"use client";

import Link from "next/link";
import { useState } from "react";
import { megaMenus, simpleNavLinks } from "@/lib/navigation";
import type { MegaMenu } from "@/types";
import {
  SearchIcon,
  CartIcon,
  ChevronDownIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/icons";

// Ordered nav: Trang Chủ | Bé Trai▾ | Bé Gái▾ | Bộ Sưu Tập▾ | Outlet | Cửa hàng | Blog
const [trangChu, ...restSimple] = simpleNavLinks;

function MegaMenuItem({ menu }: { menu: MegaMenu }) {
  return (
    <li className="group relative flex items-center">
      <a
        href={menu.href}
        className="font-display flex items-center gap-1 py-6 text-[17px] font-bold text-[#b08560] hover:text-[#8a6647]"
      >
        {menu.label}
        <ChevronDownIcon className="h-4 w-4" />
      </a>
      {/* Mega panel */}
      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
        <div className="mt-0 min-w-[520px] rounded-lg border border-black/5 bg-white p-6 shadow-xl">
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-3">
            {menu.groups.map((g) => (
              <div key={g.title}>
                <h3 className="font-display mb-2 text-[18px] font-bold text-black">
                  {g.title}
                </h3>
                <ul className="space-y-1.5">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        className="text-[16px] text-black hover:text-[#b08560]"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

export function SiteHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-black/5 bg-white shadow-sm">
      <div className="cocandy-container flex h-[72px] items-center gap-4">
        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Menu"
          className="lg:hidden"
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon className="h-7 w-7 text-[#b08560]" />
        </button>

        {/* Logo */}
        <Link href="/" className="mx-auto flex shrink-0 items-center lg:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cocandy/logo.png"
            alt="COCANDY"
            className="h-14 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-6">
            <li>
              <a
                href={trangChu.href}
                className="font-display py-6 text-[17px] font-bold text-[#b08560] hover:text-[#8a6647]"
              >
                {trangChu.label}
              </a>
            </li>
            {megaMenus.map((m) => (
              <MegaMenuItem key={m.label} menu={m} />
            ))}
            {restSimple.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="font-display py-6 text-[17px] font-bold text-[#b08560] hover:text-[#8a6647]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Search pill (desktop) */}
          <div className="hidden items-center gap-2 rounded-full bg-[#f2f2f2] px-4 py-2.5 lg:flex">
            <SearchIcon className="h-4 w-4 text-black/50" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-56 bg-transparent text-[14px] text-black outline-none placeholder:text-black/50"
            />
          </div>
          <button type="button" aria-label="Tìm kiếm" className="lg:hidden">
            <SearchIcon className="h-6 w-6 text-black/70" />
          </button>
          {/* Cart */}
          <a href="/checkout" className="relative" aria-label="Giỏ hàng">
            <CartIcon className="h-7 w-7 text-[#b08560]" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#facc15] px-1 text-[10px] font-bold text-black">
              0
            </span>
          </a>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[300px] max-w-[85%] overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cocandy/logo.png"
                alt="COCANDY"
                className="h-10 w-auto"
              />
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setDrawerOpen(false)}
              >
                <CloseIcon className="h-6 w-6 text-black" />
              </button>
            </div>
            <nav className="space-y-4">
              <a
                href={trangChu.href}
                className="font-display block text-[16px] font-bold text-[#b08560]"
              >
                {trangChu.label}
              </a>
              {megaMenus.map((m) => (
                <div key={m.label}>
                  <a
                    href={m.href}
                    className="font-display block text-[16px] font-bold text-[#b08560]"
                  >
                    {m.label}
                  </a>
                  <div className="mt-2 space-y-3 pl-3">
                    {m.groups.map((g) => (
                      <div key={g.title}>
                        <p className="font-display text-[14px] font-bold text-black">
                          {g.title}
                        </p>
                        <ul className="mt-1 space-y-1 pl-2">
                          {g.links.map((l) => (
                            <li key={l.href}>
                              <a
                                href={l.href}
                                className="text-[14px] text-black/80"
                              >
                                {l.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {restSimple.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="font-display block text-[16px] font-bold text-[#b08560]"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
