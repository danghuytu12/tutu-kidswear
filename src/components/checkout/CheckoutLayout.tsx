"use client";

import { OrderForm } from "@/components/checkout/OrderForm";
import { CartSummary } from "@/components/checkout/CartSummary";

export function CheckoutLayout() {
  return (
    <div className="cocandy-container grid gap-10 py-8 lg:grid-cols-[1.4fr_1fr]">
      <OrderForm />
      <CartSummary />
    </div>
  );
}
