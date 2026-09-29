"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import {
  Bike,
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
  type LucideIcon,
} from "lucide-react";
import { useCart } from "./cart-provider";
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
};
type Props = {
  role: Role;
  signedIn: boolean;
  labels: SideMenuLabels;
  langToggle: React.ReactNode;
  whatsapp: string | null;
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
  return { shop, work };
}

function MenuBody(props: Props & { onNavigate?: () => void }) {
  const { labels, signedIn, langToggle, whatsapp, onNavigate } = props;
  const path = usePathname();
  const { shop, work } = useEntries(props);
  const item = (e: Entry) => {
    const active = e.href === "/" ? path === "/" : path.startsWith(e.href);
    return (
      <li key={e.href}>
        <Link
          href={e.href}
          onClick={onNavigate}
          className={`relative flex h-12 items-center gap-3 rounded-xl px-3 font-semibold transition ${active ? "text-accent" : "text-foreground hover:bg-surface-2"}`}
        >
          {active && (
            <m.span
              layoutId={onNavigate ? "menu-active-drawer" : "menu-active-panel"}
              className="absolute inset-0 -z-10 rounded-xl bg-accent/10"
            />
          )}
          <e.Icon
            className="h-5 w-5 shrink-0"
            strokeWidth={active ? 2.2 : 1.8}
            aria-hidden="true"
          />
          <span className="flex-1">{e.label}</span>
          {!!e.badge && (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-ink">
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
        className="rounded-2xl p-4 text-accent-ink"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-2), var(--accent) 55%, var(--accent-deep))",
        }}
      >
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
        {work.length > 0 && (
          <div>
            <p className="mb-1 px-3 text-xs font-bold uppercase tracking-wide text-muted">
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
        aria-label={props.labels.menu}
        aria-expanded={open}
        className={props.className}
      >
        <Menu className="h-6 w-6" />
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
                  onClick={() => setOpen(false)}
                />
                <m.aside
                  initial={{ x: off }}
                  animate={{ x: 0 }}
                  exit={{ x: off }}
                  transition={{ type: "spring", stiffness: 380, damping: 38 }}
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
                      aria-label={props.labels.close}
                      className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2"
                    >
                      <X className="h-5 w-5" />
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
    <aside className="sticky top-[4.25rem] hidden h-[calc(100dvh-5.25rem)] w-64 shrink-0 overflow-y-auto rounded-3xl border border-line bg-surface p-3 shadow-sm lg:block">
      <MenuBody {...props} />
    </aside>
  );
}
