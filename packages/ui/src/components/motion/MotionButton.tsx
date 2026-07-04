"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";

type MotionButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A <button> drop-in with a snappy hover/press scale. When disabled, motion is
 * suppressed so the button feels inert. Forwards all native button props.
 */
export function MotionButton(
  { disabled, ...props }: MotionButtonProps
) {
  return (
    <motion.button
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...(props as Record<string, unknown>)}
    />
  );
}
