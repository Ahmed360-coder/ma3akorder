"use client";

import { useCart, type Cart, type CartLine } from "@/components/cart-provider";

export function AddToCart({
  store,
  line,
  label,
  replaceText,
}: {
  store: Omit<Cart, "lines">;
  line: Omit<CartLine, "qty">;
  label: string;
  replaceText: string;
}) {
  const { cart, add, replaceWith, setQty } = useCart();
  const inCart = cart?.businessId === store.businessId ? cart.lines.find((l) => l.itemId === line.itemId) : undefined;

  if (inCart) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 p-1">
        <button className="h-9 w-9 rounded-lg text-lg font-bold hover:bg-surface" onClick={() => setQty(line.itemId, inCart.qty - 1)} aria-label="-">
          −
        </button>
        <span className="min-w-5 text-center font-bold">{inCart.qty}</span>
        <button className="h-9 w-9 rounded-lg text-lg font-bold hover:bg-surface" onClick={() => setQty(line.itemId, inCart.qty + 1)} aria-label="+">
          +
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn-primary h-10 px-4"
      onClick={() => {
        if (add(store, line)) return;
        if (window.confirm(replaceText)) replaceWith(store, line);
      }}
    >
      {label}
    </button>
  );
}
