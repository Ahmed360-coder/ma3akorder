"use client";

import { AnimatePresence, m } from "motion/react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, type Cart, type CartLine } from "@/components/cart-provider";

export function AddToCart({
  store,
  line,
  label,
  replaceText,
  qtyLabels,
}: {
  store: Omit<Cart, "lines">;
  line: Omit<CartLine, "qty">;
  label: string;
  replaceText: string;
  qtyLabels: { addOne: string; removeOne: string; removeItem: string };
}) {
  const { cart, add, replaceWith, setQty } = useCart();
  const inCart = cart?.businessId === store.businessId ? cart.lines.find((l) => l.itemId === line.itemId) : undefined;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {inCart ? (
        <m.div
          key="stepper"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1 rounded-xl border border-accent/40 bg-accent/10 p-1"
        >
          <button className="grid h-9 w-9 place-items-center rounded-lg text-accent hover:bg-accent/15 active:scale-90" onClick={() => setQty(line.itemId, inCart.qty - 1)} aria-label={inCart.qty === 1 ? qtyLabels.removeItem : qtyLabels.removeOne} title={inCart.qty === 1 ? qtyLabels.removeItem : qtyLabels.removeOne}>
            {inCart.qty === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          </button>
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span key={inCart.qty} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="min-w-5 text-center font-bold">
              {inCart.qty}
            </m.span>
          </AnimatePresence>
          <button className="grid h-9 w-9 place-items-center rounded-lg text-accent hover:bg-accent/15 active:scale-90" onClick={() => setQty(line.itemId, inCart.qty + 1)} aria-label={qtyLabels.addOne} title={qtyLabels.addOne}>
            <Plus className="h-4 w-4" />
          </button>
        </m.div>
      ) : (
        <m.button
          key="add"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.92 }}
          className="btn-primary h-10 gap-1 px-3.5"
          onClick={() => {
            if (add(store, line)) return;
            if (window.confirm(replaceText)) replaceWith(store, line);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {label}
        </m.button>
      )}
    </AnimatePresence>
  );
}
