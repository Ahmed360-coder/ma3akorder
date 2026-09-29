"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";
import { House, ReceiptText, ShoppingBag, UserRound, Wallet } from "lucide-react";
import { useCart } from "./cart-provider";

type Labels = { home: string; orders: string; spending: string; cart: string; account: string };

// Phone-only tab bar, like the big delivery apps: everything a customer needs is one thumb away.
export function BottomNav({ labels, signedIn }: { labels: Labels; signedIn: boolean }) {
  const path = usePathname();
  const { count } = useCart();
  const tabs = [
    { href: "/", label: labels.home, Icon: House, match: (p: string) => p === "/" || p.startsWith("/stores") },
    ...(signedIn
      ? [
          { href: "/orders", label: labels.orders, Icon: ReceiptText, match: (p: string) => p.startsWith("/orders") },
          { href: "/spending", label: labels.spending, Icon: Wallet, match: (p: string) => p.startsWith("/spending") },
        ]
      : []),
    { href: "/cart", label: labels.cart, Icon: ShoppingBag, match: (p: string) => p.startsWith("/cart"), badge: count },
    { href: signedIn ? "/account" : "/login", label: labels.account, Icon: UserRound, match: (p: string) => p.startsWith("/account") || p.startsWith("/login") },
  ];

  return (
    <nav className="bottom-nav glass fixed inset-x-0 bottom-0 z-30 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {tabs.map(({ href, label, Icon, match, badge }) => {
          const active = match(path);
          return (
            <li key={href} className="flex-1">
              <Link href={href} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${active ? "text-accent" : "text-muted"}`}>
                {active && <m.span layoutId="bottom-nav-pill" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent" />}
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  {!!badge && (
                    <span key={badge} className="pop absolute -end-2.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-warm px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
