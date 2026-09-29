import type { Metadata } from "next";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { getCustomerLocation } from "@/lib/location-server";
import { getOpenDishes, type Dish } from "@/lib/discover";
import { getStoreCards } from "@/lib/stores";
import { createClient } from "@/lib/supabase/server";
import { pickName } from "@/lib/format";
import { PageTitle } from "@/components/discover/page-title";
import { TrendingBoard, type TrendRow } from "./trending-board";

export const metadata: Metadata = { title: "Trending nearby" };

type PulseTop = { item_id: string; business_id: string; name_ar: string; name_en: string | null; price: number; photo_url: string | null; stock_count: number | null; orders: number; qty: number };
type Pulse = { orders_today: number; orders_week: number; top: PulseTop[] };

export default async function TrendingPage() {
  const { t, locale } = await getDictionary();
  const x = getExtras(locale);
  const loc = await getCustomerLocation();
  const supabase = await createClient();
  const [{ data }, cards, open] = await Promise.all([supabase.rpc("neighbourhood_pulse", { p_limit: 12 }), getStoreCards(t, locale, loc), getOpenDishes(t, locale, loc)]);
  const pulse = (data ?? { orders_today: 0, orders_week: 0, top: [] }) as Pulse;
  const cardById = new Map(cards.map((c) => [c.id, c]));

  // Only stores the customer can see (hidden demo stores drop out here).
  const rows: TrendRow[] = pulse.top
    .filter((r) => cardById.has(r.business_id))
    .map((r) => {
      const c = cardById.get(r.business_id)!;
      const dish: Dish = { itemId: r.item_id, name: pickName(locale, r.name_ar, r.name_en), price: Number(r.price), photo: r.photo_url, stock: r.stock_count, storeId: r.business_id, search: "" };
      return { dish, orders: Number(r.orders), storeName: c.name, category: c.category };
    });
  const fallback: TrendRow[] = rows.length
    ? []
    : open.dishes.slice(0, 6).map((d) => {
        const s = open.stores.find((st) => st.id === d.storeId)!;
        return { dish: d, orders: 0, storeName: s.name, category: s.category };
      });

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-28 pt-6">
        <PageTitle title={x.trending.title} subtitle={x.trending.subtitle} art="/art/real/chicken.webp" back={x.back} />
        <TrendingBoard
          today={Number(pulse.orders_today)}
          week={Number(pulse.orders_week)}
          rows={rows}
          fallback={fallback}
          openStores={open.stores}
          locale={locale}
          x={{ ...x.trending, viewCart: x.viewCart, otherStore: x.otherStoreInCart }}
        />
      </main>
    </>
  );
}
