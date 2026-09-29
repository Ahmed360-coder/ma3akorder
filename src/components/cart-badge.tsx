"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartBadge({ label }: { label: string }) {
  const { count } = useCart();
  return (
    <Link href="/cart" title={label} className="relative hidden h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground md:inline-flex">
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {label}
      {count > 0 && (
        <span key={count} className="pop absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-warm px-1 text-[10px] font-bold text-white">{count}</span>
      )}
    </Link>
  );
}
