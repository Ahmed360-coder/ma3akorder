"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { itemId: string; name: string; price: number; qty: number; stock: number | null };
export type Cart = {
  businessId: string;
  businessName: string;
  deliveryFee: number;
  minOrder: number;
  lines: CartLine[];
};
type StoreInfo = Omit<Cart, "lines">;

type CartContextValue = {
  cart: Cart | null;
  count: number;
  subtotal: number;
  add: (store: StoreInfo, line: Omit<CartLine, "qty">) => boolean;
  setQty: (itemId: string, qty: number) => void;
  clear: () => void;
  replaceWith: (store: StoreInfo, line: Omit<CartLine, "qty">) => void;
  load: (cart: Cart) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "m3akorder.cart";

// One store per cart, saved on the device so it survives a page refresh.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = useCallback((next: Cart | null) => {
    setCart(next);
    try {
      if (next && next.lines.length) localStorage.setItem(KEY, JSON.stringify(next));
      else localStorage.removeItem(KEY);
    } catch {}
  }, []);

  const add = useCallback<CartContextValue["add"]>(
    (store, line) => {
      if (cart && cart.businessId !== store.businessId && cart.lines.length) return false;
      const base: Cart = cart && cart.businessId === store.businessId ? { ...cart, ...store } : { ...store, lines: [] };
      const existing = base.lines.find((l) => l.itemId === line.itemId);
      const max = line.stock ?? 50;
      const lines = existing
        ? base.lines.map((l) => (l.itemId === line.itemId ? { ...l, qty: Math.min(l.qty + 1, max) } : l))
        : [...base.lines, { ...line, qty: 1 }];
      persist({ ...base, lines });
      return true;
    },
    [cart, persist],
  );

  const setQty = useCallback(
    (itemId: string, qty: number) => {
      if (!cart) return;
      const lines = cart.lines
        .map((l) => (l.itemId === itemId ? { ...l, qty: Math.min(qty, l.stock ?? 50) } : l))
        .filter((l) => l.qty > 0);
      persist(lines.length ? { ...cart, lines } : null);
    },
    [cart, persist],
  );

  const clear = useCallback(() => persist(null), [persist]);

  // Start a fresh cart for a different store.
  const replaceWith = useCallback<CartContextValue["replaceWith"]>(
    (store, line) => persist({ ...store, lines: [{ ...line, qty: 1 }] }),
    [persist],
  );

  const load = useCallback((next: Cart) => persist(next), [persist]);

  const value = useMemo(() => {
    const count = cart?.lines.reduce((n, l) => n + l.qty, 0) ?? 0;
    const subtotal = cart?.lines.reduce((n, l) => n + l.qty * l.price, 0) ?? 0;
    return { cart, count, subtotal, add, setQty, clear, replaceWith, load };
  }, [cart, add, setQty, clear, replaceWith, load]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
