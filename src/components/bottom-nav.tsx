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
    <nav className="bottom-nav fixed inset-x-3 bottom-[calc(0.6rem+env(safe-area-inset-bottom))] z-30 md:hidden">
      <ul className="glass mx-auto flex max-w-md items-stretch justify-around rounded-[1.6rem] border border-line/80 p-1.5 shadow-[0_18px_40px_-16px_rgba(34,21,18,0.35)]">
        {tabs.map(({ href, label, Icon, match, badge }) => {
          const active = match(path);
          return (
            <li key={href} className="relative isolate flex-1">
              <Link href={href} className={`relative flex flex-col items-center gap-0.5 rounded-[1.2rem] py-2 text-[11px] font-bold transition-colors ${active ? "text-accent" : "text-muted"}`}>
                {active && <m.span layoutId="bottom-nav-pill" transition={{ type: "spring", duration: 0.35, bounce: 0.15 }} className="absolute inset-0 -z-10 rounded-[1.2rem] bg-accent/10" />}
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
