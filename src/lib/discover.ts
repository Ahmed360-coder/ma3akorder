import { createClient } from "@/lib/supabase/server";
import { pickName } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Item } from "@/lib/types";
import type { Loc } from "@/lib/location";
import { getStoreCards, type StoreCard } from "@/lib/stores";

export type Dish = {
  itemId: string;
  name: string;
  price: number;
  photo: string | null;
  stock: number | null;
  storeId: string;
  // Both names, for matching searches in either language.
  search: string;
};

export type DiscoverStore = Pick<StoreCard, "id" | "name" | "category" | "logo" | "fee" | "prep" | "rating" | "distanceText"> & {
  minOrder: number;
};

// Dishes that can be ordered right now: from open stores that deliver to the customer, in stock.
export async function getOpenDishes(t: Dictionary, locale: string, loc: Loc | null) {
  const cards = (await getStoreCards(t, locale, loc)).filter((c) => c.isOpen && c.inRange);
  if (!cards.length) return { stores: [] as DiscoverStore[], dishes: [] as Dish[] };
  const supabase = await createClient();
  const ids = cards.map((c) => c.id);
  const [{ data: items }, { data: mins }] = await Promise.all([
    supabase.from("items").select("*").in("business_id", ids).eq("is_available", true),
    supabase.from("businesses").select("id, min_order").in("id", ids),
  ]);
  const minById = new Map((mins ?? []).map((b) => [b.id as string, Number(b.min_order)]));
  const dishes = ((items ?? []) as Item[])
    .filter((i) => i.stock_count === null || i.stock_count > 0)
    .map((i) => ({
      itemId: i.id,
      name: pickName(locale, i.name_ar, i.name_en),
      price: Number(i.price),
      photo: i.photo_url,
      stock: i.stock_count,
      storeId: i.business_id,
      search: `${i.name_ar} ${i.name_en ?? ""} ${i.description ?? ""}`,
    }));
  const withDishes = new Set(dishes.map((d) => d.storeId));
  const stores = cards
    .filter((c) => withDishes.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, category: c.category, logo: c.logo, fee: c.fee, prep: c.prep, rating: c.rating, distanceText: c.distanceText, minOrder: minById.get(c.id) ?? 0 }));
  return { stores, dishes };
}
