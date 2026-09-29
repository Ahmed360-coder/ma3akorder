import type { Viewport } from "next";
import { Header } from "@/components/header";
import { LanguageToggle } from "@/components/language-toggle";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { getStoreCards } from "@/lib/stores";
import type { DeliveryAddress } from "@/lib/types";
import { HomeFeed } from "./home-feed";

// Phone status bar matches the orange top band.
export const viewport: Viewport = { themeColor: "#ff8a3d" };

export default async function Home() {
  const { t, locale } = await getDictionary();
  const supabase = await createClient();
  const { user } = await getCurrentProfile();
  const [cards, { data: recent }] = await Promise.all([
    getStoreCards(t, locale),
    user
      ? supabase.from("orders").select("business_id, delivery_address").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(30)
      : Promise.resolve({ data: [] as { business_id: string; delivery_address: DeliveryAddress }[] }),
  ]);
  const againIds = [...new Set((recent ?? []).map((o) => o.business_id as string))].slice(0, 8);
  const lastArea = ((recent ?? [])[0]?.delivery_address as DeliveryAddress | undefined)?.area;

  return (
    <>
      <Header hideOnPhone />
      <HomeFeed
        stores={cards}
        againIds={againIds}
        langToggle={<LanguageToggle label={t.switchLanguage} />}
        labels={{
          brand: t.brand,
          deliverTo: t.ui.deliverTo,
          area: lastArea || t.ui.yourArea,
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
    </>
  );
}
