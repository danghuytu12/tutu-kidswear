"use client";

import { OrderForm } from "@/components/checkout/OrderForm";
import { CartSummary } from "@/components/checkout/CartSummary";
import { Reveal } from "@repo/ui/components/motion";

export function CheckoutLayout() {
  return (
    <div className="cocandy-container grid gap-10 py-8 lg:grid-cols-[1.4fr_1fr]">
      {/* min-w-0: a grid item defaults to min-width:auto and refuses to shrink
          below its content, which pushed the form wider than the container on
          narrow phones. */}
      <Reveal className="min-w-0">
        <OrderForm />
      </Reveal>
      <Reveal delay={0.1} className="min-w-0">
        <CartSummary />
      </Reveal>
    </div>
  );
}
