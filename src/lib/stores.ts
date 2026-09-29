import { createClient } from "@/lib/supabase/server";
import { formatEGP, pickName } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Business, BusinessCategory } from "@/lib/types";
import { formatKm, sortByDistance, type Loc } from "@/lib/location";

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
  // Set when the customer shared a location and the store saved its spot.
  distanceKm: number | null;
  distanceText: string | null;
  inRange: boolean;
};

// Approved stores with their average rating, shaped for the home and search screens.
// With a customer location, open stores come first, nearest first, and out-of-range ones last.
export async function getStoreCards(t: Dictionary, locale: string, loc: Loc | null = null): Promise<StoreCard[]> {
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
  const sorted = sortByDistance((data ?? []) as Business[], loc);
  const ordered = [...sorted.filter((s) => s.is_open), ...sorted.filter((s) => !s.is_open)];
  return ordered.map((s) => {
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
      distanceKm: s.distance_km,
      distanceText: s.distance_km == null ? null : formatKm(s.distance_km, locale === "ar" ? "ar" : "en"),
      inRange: s.in_range,
    };
  });
}
