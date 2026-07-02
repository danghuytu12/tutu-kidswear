"use client";

import { useEffect, useState } from "react";
import { ZaloIcon, ChevronUpIcon } from "@/components/icons";

export function FloatingWidgets() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Zalo widget bottom-right */}
      <a
        href="#"
        aria-label="Chat Zalo"
        className="fixed bottom-5 right-5 z-[90] block h-14 w-14"
      >
        <ZaloIcon className="h-14 w-14 drop-shadow-lg" />
      </a>

      {/* Scroll to top bottom-left */}
      {showTop && (
        <button
          type="button"
          aria-label="Lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 left-5 z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-[#b08560] text-white shadow-lg transition-colors hover:bg-[#8a6647]"
        >
          <ChevronUpIcon className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
