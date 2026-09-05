"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Wait this long before showing the bar, so fast navigations never flash it. */
const SHOW_DELAY_MS = 150;
/** Once visible, keep it up at least this long, so it never blinks. */
const MIN_VISIBLE_MS = 300;

/** True for a click that starts a same-tab navigation to another URL. */
function startsNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  const anchor = (event.target as Element | null)?.closest?.("a");
  if (!anchor) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return false;
  if (anchor.hasAttribute("download")) return false;

  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return false;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Same page (or only a hash change) — nothing will load.
  return (
    url.pathname + url.search !==
    window.location.pathname + window.location.search
  );
}

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  // Timers and the "shown at" stamp live in refs: changing them must not
  // re-render, and cleanup needs to reach the pending ones.
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);

  // Start on any click that begins a navigation. Next gives no "navigation
  // started" event, and useLinkStatus only covers one Link at a time, so the
  // click itself is the signal.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!startsNavigation(event)) return;
      if (showTimer.current) clearTimeout(showTimer.current);
      showTimer.current = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, SHOW_DELAY_MS);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  // The route changing means the navigation finished.
  useEffect(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    setVisible((wasVisible) => {
      if (!wasVisible) return false;
      const remaining = MIN_VISIBLE_MS - (Date.now() - shownAt.current);
      if (remaining <= 0) return false;
      hideTimer.current = setTimeout(() => setVisible(false), remaining);
      return true;
    });

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Đang tải trang"
      aria-busy="true"
      className="fixed inset-x-0 top-0 z-[200] h-[3px] overflow-hidden bg-transparent"
    >
      <div className="animate-progress h-full w-full origin-left bg-[#b08560]" />
    </div>
  );
}

/**
 * Thin bar across the top of the viewport while a page navigation is in
 * flight. `useSearchParams` needs a Suspense boundary, and this component
 * renders in the root layout, so the boundary lives here.
 */
export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
