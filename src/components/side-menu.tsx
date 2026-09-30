"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import {
  Bike,
  Flame,
  Mic,
  TrendingUp,
  Users,
  Sparkles,
  Dices,
  Heart,
  PiggyBank,
  Trophy,
  House,
  LogIn,
  Menu,
  MessageCircle,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  Wallet,
  X,
  type LucideIcon, UtensilsCrossed } from "lucide-react";
import { useCart } from "./cart-provider";
import type { DiscoverIcon, DiscoverMenu } from "./discover/links";
import { LogoMark } from "./logo";

type Role =
  | "customer"
  | "business_owner"
  | "business_staff"
  | "driver"
  | "admin"
  | null;
export type SideMenuLabels = {
  brand: string;
  menu: string;
  close: string;
  greeting: string;
  guestNote: string;
  signIn: string;
  home: string;
  search: string;
  orders: string;
  spending: string;
  cart: string;
  account: string;
  business: string;
  driver: string;
  admin: string;
  workspace: string;
  language: string;
  help: string;
  byline: string;
  // Discover pages (Spin & Eat, Feed us for…, Rewards, Favourites).
  discover?: DiscoverMenu;
};
type Props = {
  role: Role;
  signedIn: boolean;
  labels: SideMenuLabels;
  langToggle: React.ReactNode;
  whatsapp: string | null;
};
const DISCOVER_ICONS: Record<DiscoverIcon, LucideIcon> = {
  users: Users,
  mic: Mic,
  flame: Flame,
  trending: TrendingUp,
  dices: Dices,
  piggy: PiggyBank,
  trophy: Trophy,
  heart: Heart,
  utensils: UtensilsCrossed,
};
type Entry = { href: string; label: string; Icon: LucideIcon; badge?: number };

function useEntries({ role, signedIn, labels }: Props) {
  const { count } = useCart();
  const shop: Entry[] = [
    { href: "/", label: labels.home, Icon: House },
    { href: "/search", label: labels.search, Icon: Search },
    ...(signedIn
      ? [
          { href: "/orders", label: labels.orders, Icon: ReceiptText },
          { href: "/spending", label: labels.spending, Icon: Wallet },
        ]
      : []),
    { href: "/cart", label: labels.cart, Icon: ShoppingBag, badge: count },
    signedIn
      ? { href: "/account", label: labels.account, Icon: UserRound }
      : { href: "/login", label: labels.signIn, Icon: LogIn },
  ];
  const work: Entry[] = [
    ...(role === "business_owner" || role === "business_staff"
      ? [{ href: "/business", label: labels.business, Icon: Store }]
      : []),
    ...(role === "driver"
      ? [{ href: "/driver", label: labels.driver, Icon: Bike }]
      : []),
    ...(role === "admin"
      ? [{ href: "/admin", label: labels.admin, Icon: ShieldCheck }]
      : []),
  ];
  // Standout features, in their own group so they are easy to find.
  const discover: Entry[] = (labels.discover?.items ?? []).map((d) => ({ href: d.href, label: d.label, Icon: DISCOVER_ICONS[d.icon] }));
  return { shop, discover, work };
}

function MenuBody(props: Props & { onNavigate?: () => void }) {
  const { labels, signedIn, langToggle, whatsapp, onNavigate } = props;
  const path = usePathname();
  const { shop, discover, work } = useEntries(props);
  const item = (e: Entry) => {
    const active = e.href === "/" ? path === "/" : path.startsWith(e.href);
    return (
      <li key={e.href}>
        <Link
          href={e.href}
          onClick={onNavigate}
          className={`relative flex h-12 items-center gap-3 rounded-xl px-2 font-semibold transition ${active ? "text-accent" : "text-foreground hover:bg-surface-2"}`}
        >
          {active && (
            <m.span
              layoutId={onNavigate ? "menu-active-drawer" : "menu-active-panel"}
              className="absolute inset-0 -z-10 rounded-xl bg-accent/10"
            />
          )}
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${active ? "bg-warm text-warm-ink shadow-md shadow-warm/40" : "bg-surface-2 text-accent"}`}>
            <e.Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 2} aria-hidden="true" />
          </span>
          <span className="flex-1">{e.label}</span>
          {!!e.badge && (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-warm px-1.5 text-xs font-bold text-warm-ink">
              {e.badge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        className="hero-band relative isolate shrink-0 overflow-hidden rounded-2xl p-4 text-accent-ink"
      >
        <span aria-hidden="true" className="hero-rays" />
        <span aria-hidden="true" className="hero-dots" />
        <p className="text-lg font-extrabold leading-tight">
          {labels.greeting}
        </p>
        {!signedIn && (
          <>
            <p className="mt-1 text-sm opacity-90">{labels.guestNote}</p>
            <Link
              href="/login"
              onClick={onNavigate}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-accent-deep transition active:scale-95"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {labels.signIn}
            </Link>
          </>
        )}
      </div>

      <nav className="isolate flex flex-col gap-4">
        <ul className="flex flex-col gap-0.5">{shop.map(item)}</ul>
        {discover.length > 0 && labels.discover && (
          <div>
            <p className="mb-1 flex items-center gap-2 px-3 text-sm font-bold text-muted">
              <Sparkles className="h-3.5 w-3.5 text-warm" aria-hidden="true" />
              {labels.discover.title}
            </p>
            <ul className="flex flex-col gap-0.5">{discover.map(item)}</ul>
          </div>
        )}
        {work.length > 0 && (
          <div>
            <p className="mb-1 px-3 text-sm font-bold text-muted">
              {labels.workspace}
            </p>
            <ul className="flex flex-col gap-0.5">{work.map(item)}</ul>
          </div>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
        <div className="flex h-12 items-center justify-between gap-3 px-3">
          <span className="text-sm font-semibold text-muted">
            {labels.language}
          </span>
          {langToggle}
        </div>
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center gap-3 rounded-xl px-3 font-semibold text-foreground hover:bg-surface-2"
          >
            <MessageCircle
              className="h-5 w-5 text-[#25D366]"
              aria-hidden="true"
            />
            {labels.help}
          </a>
        )}
        <p className="px-3 pt-1 text-xs font-semibold text-accent">{labels.byline}</p>
      </div>
    </div>
  );
}

// Phones: a menu button that slides a drawer in from the reading-start side.
export function SideMenuButton(props: Props & { className?: string }) {
  const [open, setOpen] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setRtl(document.documentElement.dir === "rtl");
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  const off = rtl ? "100%" : "-100%";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        title={props.labels.menu}
        className={props.className}
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
        <span className="text-[10px] font-bold leading-none">{props.labels.menu}</span>
      </button>
      {/* Rendered at the end of <body> so no parent's styles or stacking can clip it. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div
                className="fixed inset-0 z-50"
                role="dialog"
                aria-modal="true"
                aria-label={props.labels.menu}
              >
                <m.div
                  className="absolute inset-0 bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  onClick={() => setOpen(false)}
                />
                <m.aside
                  // iOS-style drawer curve; a full transform string stays smooth on busy phones.
                  initial={{ transform: `translateX(${off})` }}
                  animate={{ transform: "translateX(0%)" }}
                  exit={{ transform: `translateX(${off})` }}
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute inset-y-0 start-0 flex w-[84%] max-w-xs flex-col gap-4 overflow-y-auto bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-foreground shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2.5 text-lg font-extrabold">
                      <LogoMark className="h-9 w-9" />
                      {props.labels.brand}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      title={props.labels.close}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                  {props.labels.close}
                    </button>
                  </div>
                  <MenuBody {...props} onNavigate={() => setOpen(false)} />
                </m.aside>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

// Computers: the same menu as a fixed side panel.
export function SidePanel(props: Props) {
  return (
    <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-64 self-start shrink-0 overflow-y-auto rounded-3xl border border-line bg-surface p-3 shadow-sm lg:block">
      <MenuBody {...props} />
    </aside>
  );
}
