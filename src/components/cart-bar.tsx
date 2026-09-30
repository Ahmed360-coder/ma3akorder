"use client";

import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";
import { formatEGP } from "@/lib/format";

// Floating "view cart" bar that slides up once something is in the cart. Sits above the phone tab bar.
export function CartBar({ label, itemsLabel, locale }: { label: string; itemsLabel: string; locale: string }) {
  const { count, subtotal } = useCart();
  return (
    <AnimatePresence>
      {count > 0 && (
        <m.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          className="cart-bar fixed inset-x-0 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-30 px-4 md:bottom-6"
        >
          <Link href="/cart" className="btn-primary mx-auto flex h-14 w-full max-w-lg justify-between rounded-2xl px-4">
            <span className="inline-flex items-center gap-2">
              <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-accent-ink/15 px-1.5 text-sm">{count}</span>
              <span className="text-sm opacity-80">{itemsLabel}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              {label}
            </span>
            <span dir="auto">{formatEGP(subtotal, locale)}</span>
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  );
}
