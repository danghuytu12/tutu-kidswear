"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";

import { cn } from "@repo/ui/lib/utils";

type DrawerSide = "bottom" | "left";

const DrawerSideContext = React.createContext<DrawerSide>("bottom");

/**
 * Swipe-to-dismiss drawer (Base UI). `side="bottom"` is a mobile bottom sheet,
 * `side="left"` a slide-in nav panel. Focus trap, scroll lock, Esc and
 * outside-press dismissal are handled by Base UI.
 */
function Drawer({
  side = "bottom",
  ...props
}: Omit<DrawerPrimitive.Root.Props, "swipeDirection"> & { side?: DrawerSide }) {
  return (
    <DrawerSideContext.Provider value={side}>
      <DrawerPrimitive.Root
        swipeDirection={side === "left" ? "left" : "down"}
        {...props}
      />
    </DrawerSideContext.Provider>
  );
}

function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

// While swiping, Base UI sets an inline `transform`; the resting/release
// position must therefore also use `transform` (not Tailwind's `translate-*`,
// which is a separate property and would stack with it).
const popupSide: Record<DrawerSide, string> = {
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)] [transform:translateY(var(--drawer-swipe-movement-y,0px))] data-[ending-style]:[transform:translateY(100%)] data-[starting-style]:[transform:translateY(100%)]",
  left: "inset-y-0 left-0 h-dvh w-[300px] max-w-[85%] [transform:translateX(var(--drawer-swipe-movement-x,0px))] data-[ending-style]:[transform:translateX(-100%)] data-[starting-style]:[transform:translateX(-100%)]",
};

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  const side = React.useContext(DrawerSideContext);
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop className="fixed inset-0 z-[200] bg-black/40 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-[201]">
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            "fixed flex flex-col bg-white shadow-xl outline-none transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:duration-[calc(var(--drawer-swipe-strength,1)*400ms)]",
            popupSide[side],
            className,
          )}
          {...props}
        >
          {side === "bottom" ? (
            <div
              aria-hidden
              className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-black/15"
            />
          ) : null}
          <DrawerPrimitive.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

export { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerClose };
