"use client";

import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

import { cn } from "@repo/ui/lib/utils";

// Toast built on Base UI. Wrap the app in <ToastProvider> once; then call
// useToast().success(...) / .error(...) from any client component.

const ICONS: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const ACCENT: Record<string, string> = {
  success: "text-[#027A48]",
  error: "text-[#B42318]",
  info: "text-[#175CD3]",
};

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => {
    const Icon = ICONS[toast.type ?? "info"] ?? Info;
    const accent = ACCENT[toast.type ?? "info"] ?? ACCENT.info;
    return (
      <Toast.Root
        key={toast.id}
        toast={toast}
        className={cn(
          "absolute right-0 top-0 left-auto z-[120] w-[calc(100vw-2rem)] max-w-sm",
          "rounded-xl border border-border bg-background p-4 shadow-lg",
          "transition-all duration-200 [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-index)*0.85rem))_scale(calc(1-(var(--toast-index)*0.05)))]",
          "data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-offset-y)+(var(--toast-index)*1rem)))]",
          "data-[starting-style]:[transform:translateY(-150%)] data-[ending-style]:[transform:translateY(-150%)] data-[ending-style]:opacity-0",
        )}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", accent)} />
          <div className="min-w-0 flex-1">
            <Toast.Title className="text-sm font-semibold text-foreground" />
            <Toast.Description className="mt-0.5 text-sm text-muted-foreground" />
          </div>
          <Toast.Close
            aria-label="Đóng"
            className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Toast.Close>
        </div>
      </Toast.Root>
    );
  });
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 top-4 z-[120] flex w-[calc(100vw-2rem)] max-w-sm sm:right-6 sm:top-6">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

/**
 * Fire toasts from any client component below <ToastProvider>.
 * `success`/`error`/`info` set the toast `type` used for icon + accent colour.
 */
export function useToast() {
  const manager = Toast.useToastManager();
  return {
    success: (title: string, description?: string) =>
      manager.add({ title, description, type: "success" }),
    error: (title: string, description?: string) =>
      manager.add({ title, description, type: "error" }),
    info: (title: string, description?: string) =>
      manager.add({ title, description, type: "info" }),
  };
}
