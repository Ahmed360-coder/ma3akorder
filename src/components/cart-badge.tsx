"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

export function CartBadge({ label }: { label: string }) {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground">
      {label}
      {count > 0 && (
        <span className="ms-1 inline-grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink">{count}</span>
      )}
    </Link>
  );
}
