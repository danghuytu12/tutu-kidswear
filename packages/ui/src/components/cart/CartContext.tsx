"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "../../lib/cart";

interface CartApi {
  items: CartItem[];
  totalQty: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (href: string) => void;
  setQty: (href: string, qty: number) => void;
  clear: () => void;
}

const noop = () => {};
const CartContext = createContext<CartApi>({
  items: [],
  totalQty: 0,
  totalPrice: 0,
  addItem: noop,
  removeItem: noop,
  setQty: noop,
  clear: noop,
});

const STORAGE_KEY = "cocandy-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        // Validate shape: a bad/legacy value could otherwise inject NaN prices.
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (i): i is CartItem =>
                !!i &&
                typeof i === "object" &&
                typeof (i as CartItem).href === "string" &&
                typeof (i as CartItem).name === "string" &&
                typeof (i as CartItem).price === "number" &&
                Number.isFinite((i as CartItem).price) &&
                typeof (i as CartItem).qty === "number" &&
                (i as CartItem).qty > 0,
            ),
          );
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  const api = useMemo<CartApi>(() => {
    return {
      items,
      totalQty: items.reduce((n, i) => n + i.qty, 0),
      totalPrice: items.reduce((n, i) => n + i.price * i.qty, 0),
      addItem: (item, qty = 1) =>
        setItems((cur) => {
          const found = cur.find((i) => i.href === item.href);
          if (found) {
            return cur.map((i) =>
              i.href === item.href ? { ...i, qty: i.qty + qty } : i,
            );
          }
          return [...cur, { ...item, qty }];
        }),
      removeItem: (href) =>
        setItems((cur) => cur.filter((i) => i.href !== href)),
      setQty: (href, qty) =>
        setItems((cur) =>
          qty <= 0
            ? cur.filter((i) => i.href !== href)
            : cur.map((i) => (i.href === href ? { ...i, qty } : i)),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  return useContext(CartContext);
}
