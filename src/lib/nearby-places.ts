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
};

const TYPES = ["restaurant", "fast_food_restaurant", "pizza_restaurant", "hamburger_restaurant", "cafe", "bakery", "sandwich_shop"];

// Real restaurants around a point, straight from Google Places (New). Nothing is stored:
// Google's terms don't allow keeping this data, so each visit asks again.
export async function findNearbyRestaurants(key: string, center: { lat: number; lng: number }, language: string, radiusM = 3000) {
  await loadGoogleMaps(key, language);
  const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
  const { places } = await Place.searchNearby({
    fields: ["id", "displayName", "primaryTypeDisplayName", "rating", "userRatingCount", "location", "websiteURI", "googleMapsURI", "regularOpeningHours", "utcOffsetMinutes", "businessStatus"],
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
        };
      }),
  );
  return rows.sort((a, b) => a.distanceKm - b.distanceKm);
}
