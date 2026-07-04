"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionDistance } from "./useMotionDistance";

interface RevealProps {
  children: ReactNode;
  /** Seconds to delay the animation start (for sequencing). */
  delay?: number;
  className?: string;
}

/**
 * Fades + slides its children up as they scroll into view. Runs once. Slide
 * distance is responsive (see useMotionDistance).
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const y = useMotionDistance();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
