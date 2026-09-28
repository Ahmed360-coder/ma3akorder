"use client";

import { useRouter } from "next/navigation";
import { useCart, type Cart, type CartLine } from "@/components/cart-provider";

// Puts the same items back in the cart; prices and stock are re-checked at checkout.
export function ReorderButton({ label, store, lines }: { label: string; store: Omit<Cart, "lines">; lines: CartLine[] }) {
  const { load } = useCart();
  const router = useRouter();
  return (
    <button
      className="btn-primary"
      onClick={() => {
        if (!lines.length) return;
        load({ ...store, lines });
        router.push("/cart");
      }}
    >
      {label}
    </button>
  );
}
