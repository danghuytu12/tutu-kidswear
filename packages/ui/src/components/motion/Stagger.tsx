"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

/** Container that reveals its <StaggerItem> children one-by-one on scroll. */
export function StaggerGrid({ children, className }: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

/** One item inside a <StaggerGrid>. */
export function StaggerItem({ children, className }: StaggerProps) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
