"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  /** Pixels to lift on hover (default 4). */
  lift?: number;
}

/** Lifts + slightly scales on hover, presses on tap. For cards and icons. */
export function HoverLift({ children, className, lift = 4 }: HoverLiftProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -lift, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
