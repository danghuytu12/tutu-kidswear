"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { NAV, isActive } from "@/components/admin-nav";

/**
 * Mobile navigation: a hamburger button in the topbar that opens a slide-in
 * drawer. Below `lg` the desktop sidebar is hidden, so this is the only way to
 * move between admin pages on a phone.
 */
export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Escape to close, and lock background scrolling while the drawer is up.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const drawer = (
    <>
      <div
        role="presentation"
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 bg-black/40 duration-200 animate-in fade-in lg:hidden"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
        className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-xl duration-200 animate-in slide-in-from-left lg:hidden"
      >
        <div className="flex h-16 items-center gap-2 border-b border-black/5 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cocandy/logo.png"
            alt="Tutu Kidswear"
            className="h-10 w-auto"
          />
          <span className="font-display text-[15px] font-bold text-[#b08560]">
            Admin
          </span>
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
            className="ml-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-black/60 transition hover:bg-[#f2ece3]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium transition-colors",
                isActive(pathname, href)
                  ? "bg-[#b08560] text-white"
                  : "text-black/70 hover:bg-[#f2ece3] hover:text-[#b08560]",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-black/5 p-4 text-[12px] text-black/40">
          Tutu Kidswear © 2026
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Mở menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-black/70 transition hover:bg-[#f2ece3] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {/* Portalled to <body>: the topbar's `backdrop-blur` makes it a containing
          block for `position: fixed`, which would trap the drawer inside the
          64px-tall header. Only mounted while open, so it never runs on the
          server. */}
      {open ? createPortal(drawer, document.body) : null}
    </>
  );
}
