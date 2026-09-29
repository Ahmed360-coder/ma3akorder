"use client";

import { useCart } from "@/components/cart-provider";
import type { Dish, DiscoverStore } from "@/lib/discover";

// Put one or more dishes from a single store in the cart, asking first if the cart holds another store.
export function useFillCart(confirmText: string) {
  const { cart, load, add, replaceWith } = useCart();
  return {
    addOne(store: DiscoverStore, dish: Dish) {
      const info = { businessId: store.id, businessName: store.name, deliveryFee: store.fee, minOrder: store.minOrder };
      const line = { itemId: dish.itemId, name: dish.name, price: dish.price, stock: dish.stock };
      if (add(info, line)) return true;
      if (!window.confirm(confirmText)) return false;
      replaceWith(info, line);
      return true;
    },
    loadMany(store: DiscoverStore, lines: { dish: Dish; qty: number }[]) {
      if (cart && cart.lines.length && cart.businessId !== store.id && !window.confirm(confirmText)) return false;
      load({
        businessId: store.id,
        businessName: store.name,
        deliveryFee: store.fee,
        minOrder: store.minOrder,
        lines: lines.map(({ dish, qty }) => ({ itemId: dish.itemId, name: dish.name, price: dish.price, stock: dish.stock, qty })),
      });
      return true;
    },
  };
}
