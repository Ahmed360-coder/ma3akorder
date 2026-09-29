"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartBadge({ label }: { label: string }) {
  const { count } = useCart();
  return (
    <Link href="/cart" aria-label={label} className="relative hidden h-10 w-10 place-items-center rounded-xl md:grid text-muted hover:bg-surface hover:text-foreground">
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span key={count} className="pop absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink">{count}</span>
      )}
    </Link>
  );
}
