"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@repo/ui/components/ui/drawer";
import { Spinner } from "@repo/ui/components/Spinner";

type BuyAction = "cart" | "buy";

/**
 * Mobile-only bar pinned to the bottom of the PDP. It appears while the inline
 * "add to cart / buy now" buttons (`watchRef`) are off screen, and opens a
 * bottom sheet to confirm colour/size/qty before acting — the Shopee pattern.
 */
export function MobileBuyBar({
  watchRef,
  name,
  price,
  image,
  variantLabel,
  controls,
  onAddToCart,
  onBuyNow,
  buying,
  soldOut,
}: {
  watchRef: RefObject<HTMLElement | null>;
  name: string;
  price: string;
  image: string;
  variantLabel: string;
  /** Colour / size / qty pickers, shared with the inline form. */
  controls: ReactNode;
  onAddToCart: () => void;
  onBuyNow: () => void;
  buying: boolean;
  /** Selected variant is out of stock: the sheet lets them pick another. */
  soldOut: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [action, setAction] = useState<BuyAction | null>(null);

  useEffect(() => {
    const el = watchRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(!entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [watchRef]);

  const confirm = () => {
    if (action === "cart") {
      onAddToCart();
      setAction(null);
    } else if (action === "buy") {
      onBuyNow();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-[95] flex gap-3 border-t border-black/5 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-transform duration-300 lg:hidden ${
          visible ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        inert={!visible}
      >
        <button
          type="button"
          onClick={() => setAction("cart")}
          className="flex-1 rounded bg-[#e3e3e3] py-3 text-[15px] text-black active:bg-[#d5d5d5]"
        >
          Thêm vào giỏ hàng
        </button>
        <button
          type="button"
          onClick={() => setAction("buy")}
          className="flex-1 rounded bg-[#b08560] py-3 text-[15px] font-semibold text-white active:bg-[#8a6647]"
        >
          Mua ngay
        </button>
      </div>

      <Drawer
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
      >
        <DrawerContent>
          <div className="px-4 pt-3 pb-4">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <DrawerTitle className="line-clamp-2 text-[15px] font-semibold text-black">
                  {name}
                </DrawerTitle>
                <p className="mt-1 text-[18px] font-bold text-black">{price}</p>
                {variantLabel ? (
                  <p className="text-[13px] text-[#777]">{variantLabel}</p>
                ) : null}
              </div>
            </div>

            {controls}

            <button
              type="button"
              onClick={confirm}
              disabled={buying || soldOut}
              className="mt-6 w-full rounded bg-[#b08560] py-3 text-[16px] font-semibold text-white active:bg-[#8a6647] disabled:opacity-60"
            >
              {soldOut ? (
                "Hết hàng"
              ) : action === "buy" ? (
                <span className="inline-flex items-center justify-center gap-2">
                  {buying ? <Spinner /> : null}
                  Mua ngay
                </span>
              ) : (
                "Thêm vào giỏ hàng"
              )}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
