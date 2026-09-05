import { cn } from "@repo/ui/lib/utils";

/**
 * Placeholder block for content that is still loading.
 *
 * Uses Tailwind's `animate-pulse` rather than framer-motion: `Reveal` and
 * `StaggerGrid` already animate real content as it enters, and stacking a
 * second animation on the swap makes the transition jump.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-black/[0.07]", className)}
    />
  );
}
