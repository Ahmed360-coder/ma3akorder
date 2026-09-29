import { createClient } from "@/lib/supabase/server";
import { formatEGP, pickName } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Business, BusinessCategory } from "@/lib/types";

export type StoreCard = {
  id: string;
  name: string;
  category: BusinessCategory;
  categoryLabel: string;
  area: string;
  isOpen: boolean;
  fee: number;
  feeText: string;
  prep: number;
  rating: { avg: number; n: number } | null;
};

// Approved stores with their average rating, shaped for the home and search screens.
export async function getStoreCards(t: Dictionary, locale: string): Promise<StoreCard[]> {
  const supabase = await createClient();
  const [{ data }, { data: ratingRows }] = await Promise.all([
    supabase.from("businesses").select("*").eq("status", "approved").order("is_open", { ascending: false }).order("name_ar"),
    supabase.from("ratings").select("business_id, stars").eq("target", "business"),
  ]);
  const ratings = new Map<string, { sum: number; n: number }>();
  for (const r of ratingRows ?? []) {
    const cur = ratings.get(r.business_id) ?? { sum: 0, n: 0 };
    ratings.set(r.business_id, { sum: cur.sum + r.stars, n: cur.n + 1 });
  }
  return ((data ?? []) as Business[]).map((s) => {
    const r = ratings.get(s.id);
    return {
      id: s.id,
      name: pickName(locale, s.name_ar, s.name_en),
      category: s.category,
      categoryLabel: t.categories[s.category],
      area: s.area,
      isOpen: s.is_open,
      fee: Number(s.delivery_fee),
      feeText: formatEGP(s.delivery_fee, locale),
      prep: s.prep_minutes,
      rating: r ? { avg: r.sum / r.n, n: r.n } : null,
    };
  });
}
