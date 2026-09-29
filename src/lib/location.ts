// Customer location, distance maths and a fallback list of areas.
// Shared by server and client code, so no server-only imports here.

// precise = from the phone's GPS, not the centre of a picked area.
export type Loc = { lat: number; lng: number; label?: string; precise?: boolean };

export const LOCATION_COOKIE = "loc";

export function parseLoc(raw: string | undefined | null): Loc | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (typeof v?.lat === "number" && typeof v?.lng === "number" && Math.abs(v.lat) <= 90 && Math.abs(v.lng) <= 180) {
      return { lat: v.lat, lng: v.lng, label: typeof v.label === "string" ? v.label.slice(0, 60) : undefined, precise: v.precise === true };
    }
  } catch {}
  return null;
}

// Straight-line distance in km (haversine). Good enough for "how far is this shop".
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type WithDistance<T> = T & { distance_km: number | null; in_range: boolean };

// Nearest first. Stores inside their delivery radius come before those outside it,
// and stores that haven't set a location go last. Without a customer location the order is kept.
export function sortByDistance<T extends { lat: number | null; lng: number | null; delivery_radius_km: number }>(
  stores: T[],
  loc: Loc | null,
): WithDistance<T>[] {
  const withD = stores.map((s) => {
    const d = loc && s.lat != null && s.lng != null ? distanceKm(loc, { lat: s.lat, lng: s.lng }) : null;
    return { ...s, distance_km: d, in_range: d == null ? true : d <= Number(s.delivery_radius_km) };
  });
  if (!loc) return withD;
  const rank = (s: WithDistance<T>) => (s.distance_km == null ? 1 : s.in_range ? 0 : 2);
  return withD.sort((a, b) => rank(a) - rank(b) || (a.distance_km ?? 0) - (b.distance_km ?? 0));
}

export function formatKm(km: number, locale: "ar" | "en") {
  if (km < 1) {
    const m = Math.max(50, Math.round((km * 1000) / 50) * 50);
    return locale === "ar" ? `${m.toLocaleString("ar-EG")} م` : `${m} m`;
  }
  const v = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return locale === "ar" ? `${Number(v).toLocaleString("ar-EG")} كم` : `${v} km`;
}

// For people who don't share their location. Approximate centre of each area.
export const AREAS: { key: string; ar: string; en: string; lat: number; lng: number }[] = [
  { key: "maadi", ar: "المعادي", en: "Maadi", lat: 29.9602, lng: 31.2569 },
  { key: "nasr-city", ar: "مدينة نصر", en: "Nasr City", lat: 30.0561, lng: 31.3301 },
  { key: "heliopolis", ar: "مصر الجديدة", en: "Heliopolis", lat: 30.0911, lng: 31.3225 },
  { key: "new-cairo", ar: "القاهرة الجديدة / التجمع", en: "New Cairo", lat: 30.0074, lng: 31.4913 },
  { key: "mokattam", ar: "المقطم", en: "Mokattam", lat: 30.0172, lng: 31.3065 },
  { key: "downtown", ar: "وسط البلد", en: "Downtown", lat: 30.0444, lng: 31.2357 },
  { key: "zamalek", ar: "الزمالك", en: "Zamalek", lat: 30.0609, lng: 31.2197 },
  { key: "shubra", ar: "شبرا", en: "Shubra", lat: 30.0976, lng: 31.2446 },
  { key: "dokki", ar: "الدقي", en: "Dokki", lat: 30.0384, lng: 31.2123 },
  { key: "mohandessin", ar: "المهندسين", en: "Mohandessin", lat: 30.0551, lng: 31.2003 },
  { key: "haram", ar: "الهرم / فيصل", en: "Haram / Faisal", lat: 29.9993, lng: 31.1636 },
  { key: "october", ar: "6 أكتوبر", en: "6th of October", lat: 29.9381, lng: 30.9135 },
  { key: "zayed", ar: "الشيخ زايد", en: "Sheikh Zayed", lat: 30.0444, lng: 30.976 },
  { key: "alexandria", ar: "الإسكندرية", en: "Alexandria", lat: 31.2001, lng: 29.9187 },
];

export function mapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
