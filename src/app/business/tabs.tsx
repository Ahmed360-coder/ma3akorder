"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";

export function BusinessTabs({ labels }: { labels: { orders: string; menu: string; settings: string } }) {
  const path = usePathname();
  const tabs = [
    { href: "/business", label: labels.orders },
    { href: "/business/menu", label: labels.menu },
    { href: "/business/settings", label: labels.settings },
  ];
  return (
    <nav className="flex gap-1 rounded-xl border border-line bg-surface p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`relative flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-colors ${path === tab.href ? "text-foreground" : "text-muted"}`}
        >
          {path === tab.href && <m.span layoutId="business-tab" className="absolute inset-0 rounded-lg bg-surface-2" />}
          <span className="relative">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
