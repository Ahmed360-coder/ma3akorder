import type { Viewport } from "next";
import { Header } from "@/components/header";
import { LanguageToggle } from "@/components/language-toggle";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { getStoreCards } from "@/lib/stores";
import type { DeliveryAddress } from "@/lib/types";
import { HomeFeed } from "./home-feed";
import { SidePanel, type SideMenuLabels } from "@/components/side-menu";
import { SUPPORT_WHATSAPP } from "@/lib/site";
import { fill } from "@/lib/format";
import { getCustomerLocation } from "@/lib/location-server";
import { searchLabels } from "@/lib/search-data";
import { WelcomeBack } from "@/components/welcome-back";
import { DiscoverRow } from "@/components/discover/discover-row";
import { getExtras } from "@/lib/i18n/extras";

// Phone status bar matches the green top band.
export const viewport: Viewport = { themeColor: "#12a150" };

export default async function Home() {
  const { t, locale } = await getDictionary();
  const supabase = await createClient();
  const { user, profile } = await getCurrentProfile();
  const loc = await getCustomerLocation();
  const [cards, { data: recent }] = await Promise.all([
    getStoreCards(t, locale, loc),
    user
      ? supabase.from("orders").select("business_id, delivery_address").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(30)
      : Promise.resolve({ data: [] as { business_id: string; delivery_address: DeliveryAddress }[] }),
  ]);
  const againIds = [...new Set((recent ?? []).map((o) => o.business_id as string))].slice(0, 8);
  const lastArea = ((recent ?? [])[0]?.delivery_address as DeliveryAddress | undefined)?.area;

  const role = profile?.onboarded ? profile.role : null;
  const firstName = profile?.full_name?.split(" ")[0];
  const menuLabels: SideMenuLabels = {
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
    discover: (({ title, spin, feed, rewards, favorites, guide }) => ({ title, spin: spin.title, feed: feed.title, rewards: rewards.title, favorites: favorites.title, guide: guide.title }))(getExtras(locale).discover),
  };
  const menu = { role, signedIn: !!user, labels: menuLabels, langToggle: <LanguageToggle label={t.switchLanguage} />, whatsapp: SUPPORT_WHATSAPP };

  return (
    <>
      <Header hideOnPhone />
      {user && firstName && <WelcomeBack title={fill(t.ui.welcomeBack, { name: firstName })} body={t.ui.welcomeBackBody} close={t.ui.close} />}
      {/* Computers get the menu as a side panel; phones open it as a drawer from the top band. */}
      <div className="mx-auto flex w-full max-w-7xl gap-6 lg:px-4 lg:pt-4">
        <SidePanel {...menu} />
        <div className="min-w-0 flex-1">
      <HomeFeed
        menu={menu}
        searchLabels={searchLabels(t)}
        discover={<DiscoverRow x={getExtras(locale).discover} />}
        stores={cards}
        againIds={againIds}
        langToggle={<LanguageToggle label={t.switchLanguage} />}
        location={{ t: t.location, locale, current: loc }}
        labels={{
          brand: t.brand,
          demo: t.ui.demo,
          deliverTo: t.ui.deliverTo,
          area: loc?.label || lastArea || t.ui.yourArea,
          search: t.ui.searchAll,
          cart: t.nav.cart,
          orderAgain: t.ui.orderAgain,
          nearYou: t.stores.title,
          none: t.stores.none,
          noMatch: t.ui.noMatch,
          open: t.common.open,
          closed: t.common.closed,
          openCount: t.ui.openCount,
          soon: t.ui.soon,
          mins: t.ui.mins,
          freeDelivery: t.ui.freeDelivery,
          all: t.ui.all,
          tiles: t.ui.tiles,
          promos: [
            { ...t.ui.promos.worth, href: cards.find((c) => c.isOpen) ? `/stores/${cards.find((c) => c.isOpen)!.id}` : undefined },
            { ...t.ui.promos.budget, href: user ? "/spending" : "/login" },
            { ...t.ui.promos.local },
          ],
        }}
      />
        </div>
      </div>
    </>
  );
}
