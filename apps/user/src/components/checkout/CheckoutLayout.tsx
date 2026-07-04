"use client";

import { OrderForm } from "@/components/checkout/OrderForm";
import { CartSummary } from "@/components/checkout/CartSummary";
import { Reveal } from "@repo/ui/components/motion";

export function CheckoutLayout() {
  return (
    <div className="cocandy-container grid gap-10 py-8 lg:grid-cols-[1.4fr_1fr]">
      <Reveal>
        <OrderForm />
      </Reveal>
      <Reveal delay={0.1}>
        <CartSummary />
      </Reveal>
    </div>
  );
}
