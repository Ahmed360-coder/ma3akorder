"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { useGeolocation } from "@/lib/use-geolocation";
import { mapsLink } from "@/lib/location";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// Lets the owner save the store's spot by standing in it. Sent with the store form as lat/lng.
export function StoreLocationField({ t, lat, lng, radius }: { t: Dictionary["location"]; lat: number | null; lng: number | null; radius: number }) {
  const { locate, busy, error } = useGeolocation();
  const [pos, setPos] = useState(lat != null && lng != null ? { lat, lng } : null);
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line p-4">
      <span className="text-sm font-semibold">{t.storeSpot}</span>
      <p className="text-sm text-muted">{t.storeSpotHelp}</p>
      <input type="hidden" name="lat" value={pos?.lat ?? ""} />
      <input type="hidden" name="lng" value={pos?.lng ?? ""} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={async () => {
            const p = await locate();
            if (p) setPos(p);
          }}
        >
          <MapPin aria-hidden="true" className="inline h-4 w-4" /> {busy ? t.finding : t.useMine}
        </button>
        {pos ? (
          <a href={mapsLink(pos.lat, pos.lng)} target="_blank" rel="noopener noreferrer" className="text-sm text-positive underline underline-offset-4">
            {t.storeSpotSet}
          </a>
        ) : (
          <span className="text-sm text-muted">{t.storeSpotMissing}</span>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-warning">{error === "denied" ? t.denied : t.unavailable}</p>}
      <label className="flex flex-col gap-2 text-sm font-semibold">
        {t.radius}
        <input name="delivery_radius_km" type="number" min="0.5" max="30" step="0.5" inputMode="decimal" className="input" defaultValue={radius} />
      </label>
    </div>
  );
}
