import { Loader2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

/** Inline "working…" indicator for buttons and inputs. */
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 aria-hidden className={cn("h-4 w-4 animate-spin", className)} />
  );
}
