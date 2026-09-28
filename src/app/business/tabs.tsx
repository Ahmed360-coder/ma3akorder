"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
          className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold ${path === tab.href ? "bg-surface-2 text-foreground" : "text-muted"}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
