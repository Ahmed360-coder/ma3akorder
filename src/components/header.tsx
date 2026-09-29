import Link from "next/link";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import { CartBadge } from "./cart-badge";
import { BottomNav } from "./bottom-nav";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";

// hideOnPhone: the home page draws its own top band on phones, so only the tab bar is kept there.
export async function Header({ hideOnPhone = false }: { hideOnPhone?: boolean } = {}) {
  const { t } = await getDictionary();
  const { profile } = await getCurrentProfile();
  const role = profile?.onboarded ? profile.role : null;
  const shopper = !role || role === "customer";

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
          <Link href="/" aria-label={t.brand} className="shrink-0 transition active:scale-95">
            <Logo name={t.brand} />
          </Link>
          {/* Shoppers get the tab bar on phones, so the top links only show on wider screens. */}
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${shopper ? "hidden md:inline-flex" : "inline-flex"} h-10 items-center whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground`}
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
