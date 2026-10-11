"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@repo/ui/components/ui/drawer";
import { NAV, MOBILE_TABS, isActive } from "@/components/admin-nav";
import { LogoutButton } from "@/components/LogoutButton";

const tabHrefs: readonly string[] = MOBILE_TABS;
const tabs = NAV.filter((n) => tabHrefs.includes(n.href)).sort(
  (a, b) => tabHrefs.indexOf(a.href) - tabHrefs.indexOf(b.href),
);
const moreItems = NAV.filter((n) => !tabHrefs.includes(n.href));

const tabClass =
  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors";

/**
 * Phone/tablet navigation (< lg): four primary tabs pinned to the bottom of the
 * screen plus "Thêm", which opens a bottom sheet with the remaining pages and
 * logout. The desktop sidebar takes over from lg up.
 */
export function AdminBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((n) => isActive(pathname, n.href));

  return (
    <>
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {tabs.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    tabClass,
                    active ? "text-[#b08560]" : "text-black/50 active:text-black/70",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-[#b08560]" />
                  ) : null}
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                tabClass,
                "w-full cursor-pointer",
                moreActive ? "text-[#b08560]" : "text-black/50 active:text-black/70",
              )}
            >
              {moreActive ? (
                <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-[#b08560]" />
              ) : null}
              <LayoutGrid className="h-[22px] w-[22px]" strokeWidth={moreActive ? 2.25 : 1.75} />
              Thêm
            </button>
          </li>
        </ul>
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <div className="px-4 pt-3 pb-4">
            <DrawerTitle className="px-1 text-[15px] text-[#1D2939]">
              Thêm
            </DrawerTitle>
            <ul className="mt-3 overflow-hidden rounded-xl border border-[#E4E7EC]">
              {moreItems.map(({ label, href, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href} className="border-b border-[#F2F4F7] last:border-b-0">
                    <Link
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-14 items-center gap-3 px-4 text-[15px] font-medium",
                        active ? "bg-[#f7f1ea] text-[#b08560]" : "text-[#344054] active:bg-[#F9FAFB]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          active ? "bg-[#b08560] text-white" : "bg-[#f2ece3] text-[#b08560]",
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="flex-1">{label}</span>
                      <ChevronRight className="h-4 w-4 text-[#98A2B3]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#E4E7EC]">
              <LogoutButton variant="row" />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
