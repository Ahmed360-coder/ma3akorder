import { LanguageToggle } from "./language-toggle";
import type { SideMenuLabels } from "./side-menu";
import { discoverMenu } from "./discover/links";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { getCurrentProfile } from "@/lib/profile";
import { SUPPORT_WHATSAPP } from "@/lib/site";
import { fill } from "@/lib/format";

// Everything the side menu needs, built once per request so every page shows the same menu.
export async function getMenuProps() {
  const { t, locale } = await getDictionary();
  const { user, profile } = await getCurrentProfile();
  const role = profile?.onboarded ? profile.role : null;
  const firstName = profile?.full_name?.split(" ")[0];
  const labels: SideMenuLabels = {
    brand: t.brand,
    menu: t.ui.menu,
    close: t.ui.close,
    greeting: user && firstName ? fill(t.ui.hello, { name: firstName }) : t.ui.guest,
    guestNote: t.ui.guestNote,
    signIn: t.getStarted,
    home: t.ui.home,
    search: t.ui.searchNav,
    orders: t.nav.orders,
    spending: t.nav.spending,
    cart: t.nav.cart,
    account: t.nav.account,
    business: t.nav.business,
    driver: t.nav.driver,
    admin: t.nav.admin,
    workspace: t.ui.workspace,
    language: t.ui.language,
    help: t.site.support,
    byline: t.site.byline,
    discover: discoverMenu(getExtras(locale).discover),
  };
  return { role, signedIn: !!user, labels, langToggle: <LanguageToggle label={t.switchLanguage} />, whatsapp: SUPPORT_WHATSAPP };
}
