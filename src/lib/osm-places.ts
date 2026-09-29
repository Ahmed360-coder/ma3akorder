"use client";

import { distanceKm } from "./location";
import type { NearbyPlace } from "./nearby-places";

// Free backup for the Restaurant guide when Google Places isn't available (billing off, key refused).
// Data comes from OpenStreetMap through the public Overpass API: real names and places,
// but no photos or ratings. OpenStreetMap's licence requires the "© OpenStreetMap contributors" credit.
const SERVERS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

type Element = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

// One download per area and radius; chips and the search box then filter it on the phone.
const cache = new Map<string, Promise<Element[]>>();

async function fetchArea(center: { lat: number; lng: number }, radiusM: number): Promise<Element[]> {
  const q = `[out:json][timeout:20];(nwr(around:${radiusM},${center.lat},${center.lng})[amenity~"^(restaurant|fast_food|cafe|ice_cream|food_court)$"][name];nwr(around:${radiusM},${center.lat},${center.lng})[shop~"^(bakery|pastry|confectionery)$"][name];);out center tags 300;`;
  let lastError: unknown;
  for (const url of SERVERS) {
    try {
      const res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: q }) });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = (await res.json()) as { elements?: Element[] };
      return json.elements ?? [];
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

function area(center: { lat: number; lng: number }, radiusM: number) {
  const key = `${center.lat.toFixed(3)},${center.lng.toFixed(3)},${radiusM}`;
  let p = cache.get(key);
  if (!p) {
    p = fetchArea(center, radiusM);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

// Words too general to narrow a search ("seafood restaurant" should match on "seafood").
const STOP = new Set(["restaurant", "restaurants", "food", "مطعم", "مطاعم"]);

function pretty(v: string) {
  const s = v.split(";")[0].replace(/_/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : null;
}

export async function findOsmRestaurants(
  center: { lat: number; lng: number },
  language: string,
  { terms, radiusM = 3000 }: { terms?: string[]; radiusM?: number } = {},
): Promise<NearbyPlace[]> {
  const els = await area(center, radiusM);
  const words = (terms ?? []).map((w) => w.toLowerCase().trim()).filter((w) => w && !STOP.has(w));
  const rows: NearbyPlace[] = [];
  for (const el of els) {
    const tags = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;
    const name = (language === "ar" ? tags["name:ar"] : tags["name:en"]) || tags.name;
    if (!name) continue;
    if (words.length) {
      const hay = [tags.name, tags["name:en"], tags["name:ar"], tags.cuisine, tags.amenity, tags.shop].filter(Boolean).join(" ").toLowerCase().replace(/_/g, " ");
      if (!words.some((w) => hay.includes(w))) continue;
    }
    const website = tags.website || tags["contact:website"] || tags["contact:facebook"] || tags["contact:instagram"] || null;
    rows.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      type: tags.cuisine ? pretty(tags.cuisine) : pretty(tags.amenity ?? tags.shop ?? ""),
      rating: null,
      ratings: 0,
      open: null,
      distanceKm: distanceKm(center, { lat, lng: lon }),
      website: website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : null,
      // Opens the exact spot in the Google Maps app for directions; this is a plain link, not the paid API.
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
      photo: null,
    });
  }
  return rows.filter((r) => r.distanceKm * 1000 <= radiusM * 1.1).sort((a, b) => a.distanceKm - b.distanceKm);
}
