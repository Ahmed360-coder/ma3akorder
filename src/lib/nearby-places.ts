"use client";

import { loadGoogleMaps } from "./google-maps";
import { distanceKm } from "./location";

export type NearbyPlace = {
  id: string;
  name: string;
  type: string | null;
  rating: number | null;
  ratings: number;
  open: boolean | null;
  distanceKm: number;
  website: string | null;
  mapsUrl: string | null;
  photo: { url: string; by: string | null; byUrl: string | null } | null;
};

const TYPES = ["restaurant", "fast_food_restaurant", "pizza_restaurant", "hamburger_restaurant", "cafe", "bakery", "sandwich_shop"];
const FIELDS = [
  "id",
  "displayName",
  "primaryTypeDisplayName",
  "rating",
  "userRatingCount",
  "location",
  "websiteURI",
  "googleMapsURI",
  "regularOpeningHours",
  "utcOffsetMinutes",
  "businessStatus",
  "photos",
];

// Square around the centre, for text searches that must stay in the neighbourhood.
function box(c: { lat: number; lng: number }, radiusM: number) {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((c.lat * Math.PI) / 180));
  return { south: c.lat - dLat, north: c.lat + dLat, west: c.lng - dLng, east: c.lng + dLng };
}

// Real restaurants around a point, straight from Google Places (New). With a query ("pizza",
// "shawarma") it runs a text search; without one it lists the nearest places to eat.
// Nothing is stored: Google's terms don't allow keeping this data, so each visit asks again.
export async function findNearbyRestaurants(
  key: string,
  center: { lat: number; lng: number },
  language: string,
  { query, radiusM = 3000 }: { query?: string; radiusM?: number } = {},
) {
  await loadGoogleMaps(key, language);
  const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
  const { places } = query
    ? await Place.searchByText({ textQuery: query, fields: FIELDS, locationRestriction: box(center, radiusM), maxResultCount: 20, language, region: "eg" })
    : await Place.searchNearby({
        fields: FIELDS,
        locationRestriction: { center, radius: radiusM },
        includedPrimaryTypes: TYPES,
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        language,
        region: "eg",
      });
  const rows = await Promise.all(
    places
      .filter((p) => p.businessStatus == null || String(p.businessStatus) === "OPERATIONAL")
      .map(async (p): Promise<NearbyPlace> => {
        let open: boolean | null = null;
        try {
          open = (await p.isOpen()) ?? null;
        } catch {}
        const loc = p.location;
        const ph = p.photos?.[0];
        const author = ph?.authorAttributions?.[0];
        return {
          id: p.id,
          name: p.displayName ?? "",
          type: p.primaryTypeDisplayName ?? null,
          rating: p.rating ?? null,
          ratings: p.userRatingCount ?? 0,
          open,
          distanceKm: loc ? distanceKm(center, { lat: loc.lat(), lng: loc.lng() }) : 0,
          website: p.websiteURI ?? null,
          mapsUrl: p.googleMapsURI ?? null,
          photo: ph ? { url: ph.getURI({ maxWidth: 480, maxHeight: 320 }), by: author?.displayName ?? null, byUrl: author?.uri ?? null } : null,
        };
      }),
  );
  return rows.filter((r) => r.distanceKm * 1000 <= radiusM * 1.1).sort((a, b) => a.distanceKm - b.distanceKm);
}
