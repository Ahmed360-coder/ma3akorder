import Link from "next/link";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import { CartBadge } from "./cart-badge";
import { BottomNav } from "./bottom-nav";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { SideMenuButton } from "./side-menu";
import { getMenuProps } from "./menu-props";

// hideOnPhone: the home page draws its own top band on phones, so only the tab bar is kept there.
export async function Header({ hideOnPhone = false }: { hideOnPhone?: boolean } = {}) {
  const { t } = await getDictionary();
  const { profile } = await getCurrentProfile();
  const role = profile?.onboarded ? profile.role : null;
  const shopper = !role || role === "customer";
  const menu = await getMenuProps();

  const links: { href: string; label: string }[] = [];
  if (shopper || role === "admin") links.push({ href: "/", label: t.nav.stores });
  if (role === "customer") links.push({ href: "/orders", label: t.nav.orders }, { href: "/spending", label: t.nav.spending });
  if (role === "business_owner") links.push({ href: "/business", label: t.nav.business });
  if (role === "driver") links.push({ href: "/driver", label: t.nav.driver });
  if (role === "admin") links.push({ href: "/admin", label: t.nav.admin });
  links.push({ href: profile ? "/account" : "/login", label: profile ? t.nav.account : t.getStarted });

  return (
    <>
      <header className={`glass sticky top-0 z-20 border-b border-line/70 ${hideOnPhone ? "hidden md:block" : ""}`}>
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex shrink-0 items-center gap-1">
            {/* Phones and tablets: the side menu opens from here on every page (computers keep it pinned). */}
            {!hideOnPhone && (
              <SideMenuButton
                {...menu}
                className="-ms-1 flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-accent/10 text-accent transition hover:bg-accent/15 active:scale-95 lg:hidden"
              />
            )}
            <Link href="/" aria-label={t.brand} className="shrink-0 transition active:scale-95">
              <Logo name={t.brand} />
            </Link>
          </div>
          {/* Phones reach these pages from the Menu button, and computers from the pinned side menu, so the text links only show on tablets. */}
          <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`hidden h-10 md:inline-flex lg:hidden items-center whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground`}
              >
                {l.label}
              </Link>
            ))}
            {shopper && <CartBadge label={t.nav.cart} />}
            <LanguageToggle label={t.switchLanguage} />
          </nav>
        </div>
      </header>
      {shopper && (
        <BottomNav
          signedIn={role === "customer"}
          labels={{ home: t.ui.home, orders: t.nav.orders, spending: t.nav.spending, cart: t.nav.cart, account: profile ? t.nav.account : t.getStarted }}
        />
      )}
    </>
  );
}
