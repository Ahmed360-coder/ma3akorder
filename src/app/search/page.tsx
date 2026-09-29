import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { pickName } from "@/lib/format";
import { getStoreCards } from "@/lib/stores";
import type { Item } from "@/lib/types";
import { SearchScreen, type SearchItem } from "./search-screen";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { t, locale } = await getDictionary();
  const supabase = await createClient();
  const [stores, { data }, { data: popularRows }] = await Promise.all([
    getStoreCards(t, locale),
    supabase.from("items").select("id, business_id, name_ar, name_en, description, price, is_available").eq("is_available", true).limit(1000),
    supabase.rpc("popular_searches", { p_limit: 8 }),
  ]);
  // What people search for most in the last 30 days; starter terms until there is enough real data.
  const popular = ((popularRows ?? []) as { term: string }[]).map((r) => r.term);
  const popularTerms = popular.length >= 4 ? popular : [...new Set([...popular, ...t.ui.popularDefaults])].slice(0, 8);
  // The pilot has few stores, so everything is searched on the phone instantly; move to a database search as it grows.
  const storeIds = new Set(stores.map((s) => s.id));
  const items: SearchItem[] = ((data ?? []) as Pick<Item, "id" | "business_id" | "name_ar" | "name_en" | "description" | "price">[])
    .filter((i) => storeIds.has(i.business_id))
    .map((i) => ({ id: i.id, storeId: i.business_id, name: pickName(locale, i.name_ar, i.name_en), alt: `${i.name_ar} ${i.name_en ?? ""} ${i.description ?? ""}`, price: Number(i.price) }));

  return (
    <SearchScreen
      initialQuery={q ?? ""}
      stores={stores}
      items={items}
      popular={popularTerms}
      locale={locale}
      labels={{
        back: t.ui.back,
        search: t.ui.searchAll,
        cart: t.nav.cart,
        craving: t.ui.craving,
        recent: t.ui.recent,
        popular: t.ui.popular,
        clear: t.ui.clear,
        nearYou: t.stores.title,
        spotlight: t.ui.spotlight,
        storesTitle: t.ui.storesTitle,
        itemsTitle: t.ui.itemsTitle,
        noMatch: t.ui.noMatch,
        mins: t.ui.mins,
        tabs: t.ui.tabs,
        cravings: t.ui.cravings,
        promo: t.ui.promos.worth,
      }}
    />
  );
}
