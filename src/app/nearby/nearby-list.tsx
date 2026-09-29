"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Star } from "lucide-react";
import { GOOGLE_MAPS_KEY } from "@/lib/site";
import { formatKm } from "@/lib/location";
import { findNearbyRestaurants, type NearbyPlace } from "@/lib/nearby-places";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function NearbyList({ t, locale, center }: { t: Dictionary["nearby"]; locale: "ar" | "en"; center: { lat: number; lng: number } }) {
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null);
  const [failed, setFailed] = useState(false);

  const { lat, lng } = center;
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;
    let cancelled = false;
    setPlaces(null);
    setFailed(false);
    findNearbyRestaurants(GOOGLE_MAPS_KEY, { lat, lng }, locale)
      .then((rows) => !cancelled && setPlaces(rows))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [lat, lng, locale]);

  if (!GOOGLE_MAPS_KEY) return <p className="card text-muted">{t.notReady}</p>;
  if (failed) return <p className="card text-muted">{t.failed}</p>;
  if (!places) return <p className="card animate-pulse text-muted">{t.loading}</p>;
  if (places.length === 0) return <p className="card text-muted">{t.none}</p>;

  return (
    <>
      <ul className="flex flex-col gap-3">
        {places.map((p) => (
          <li key={p.id} className="card flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-lg font-extrabold">{p.name}</div>
                <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                  {p.type && <span>{p.type}</span>}
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatKm(p.distanceKm, locale)}
                  </span>
                  {p.rating != null && (
                    <span className="inline-flex items-center gap-0.5 text-foreground">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                      {p.rating.toFixed(1)} <span className="text-muted">({p.ratings.toLocaleString(locale === "ar" ? "ar-EG" : "en")})</span>
                    </span>
                  )}
                </div>
              </div>
              {p.open != null && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${p.open ? "bg-positive/15 text-positive" : "bg-surface-2 text-muted"}`}>
                  {p.open ? t.open : t.closed}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {p.website && (
                <a href={p.website} target="_blank" rel="noopener noreferrer" className="btn-primary h-10 text-sm">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {t.menu}
                </a>
              )}
              {p.mapsUrl && (
                <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost h-10 text-sm">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {t.maps}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      {/* Google requires this attribution wherever Places data is shown without a Google map. */}
      <p className="text-center text-xs text-muted" translate="no">
        {t.source} · Google Maps
      </p>
    </>
  );
}
