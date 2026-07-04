"use client";

import { useEffect, useState } from "react";

/**
 * Reveal slide distance in px, responsive to viewport width: 16 on phones
 * (<768px), 24 on tablet/desktop. Updates on resize. SSR-safe (defaults to 24).
 */
export function useMotionDistance(): number {
  const [distance, setDistance] = useState(24);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setDistance(mq.matches ? 16 : 24);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return distance;
}
