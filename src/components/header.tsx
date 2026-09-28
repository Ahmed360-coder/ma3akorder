import Link from "next/link";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import { CartBadge } from "./cart-badge";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";

export async function Header() {
  const { t } = await getDictionary();
  const { profile } = await getCurrentProfile();
  const role = profile?.onboarded ? profile.role : null;

  const links: { href: string; label: string }[] = [];
  if (!role || role === "customer" || role === "admin") links.push({ href: "/", label: t.nav.stores });
  if (role === "customer") links.push({ href: "/orders", label: t.nav.orders }, { href: "/spending", label: t.nav.spending });
  if (role === "business_owner") links.push({ href: "/business", label: t.nav.business });
  if (role === "driver") links.push({ href: "/driver", label: t.nav.driver });
  if (role === "admin") links.push({ href: "/admin", label: t.nav.admin });
  links.push({ href: profile ? "/account" : "/login", label: profile ? t.nav.account : t.getStarted });

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" aria-label={t.brand} className="shrink-0">
          <Logo name={t.brand} />
        </Link>
        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground">
              {l.label}
            </Link>
          ))}
          {(!role || role === "customer") && <CartBadge label={t.nav.cart} />}
          <LanguageToggle label={t.switchLanguage} />
        </nav>
      </div>
    </header>
  );
}
