"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, Search, Star } from "lucide-react";
import { GOOGLE_MAPS_KEY } from "@/lib/site";
import { formatKm } from "@/lib/location";
import { findNearbyRestaurants, type NearbyPlace } from "@/lib/nearby-places";
import { fill } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Cuisine = keyof Dictionary["nearby"]["cuisines"];
// Each chip runs a Google text search, so Egyptian favourites like koshary work too.
const CUISINES: { key: Cuisine; query?: string; art?: string }[] = [
  { key: "all" },
  { key: "burger", query: "burger", art: "/art/hamburger.webp" },
  { key: "pizza", query: "pizza", art: "/art/pizza.webp" },
  { key: "shawarma", query: "shawarma" },
  { key: "chicken", query: "fried chicken", art: "/art/poultry_leg.webp" },
  { key: "koshary", query: "koshary" },
  { key: "grill", query: "grill kebab kofta" },
  { key: "seafood", query: "seafood fish restaurant" },
  { key: "asian", query: "sushi chinese asian restaurant" },
  { key: "cafe", query: "cafe coffee", art: "/art/hot_beverage.webp" },
  { key: "sweets", query: "desserts sweets", art: "/art/shortcake.webp" },
  { key: "bakery", query: "bakery", art: "/art/croissant.webp" },
];
const RADII = [3000, 6000, 10000];

export function NearbyList({ t, locale, center }: { t: Dictionary["nearby"]; locale: "ar" | "en"; center: { lat: number; lng: number } }) {
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [cuisine, setCuisine] = useState<Cuisine>("all");
  const [typed, setTyped] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"near" | "top">("near");
  const [radius, setRadius] = useState(RADII[0]);
  const { lat, lng } = center;

  // What to ask Google: the search box wins over the chip.
  const ask = query || CUISINES.find((c) => c.key === cuisine)?.query;

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;
    let cancelled = false;
    setPlaces(null);
    setFailed(false);
    findNearbyRestaurants(GOOGLE_MAPS_KEY, { lat, lng }, locale, { query: ask, radiusM: radius })
      .then((rows) => !cancelled && setPlaces(rows))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [lat, lng, locale, ask, radius]);

  const shown = useMemo(() => {
    if (!places) return null;
    if (sort === "near") return places;
    // Rating weighted a little by how many people rated, so one 5-star review doesn't top the list.
    const score = (p: NearbyPlace) => (p.rating ?? 0) - 1 / Math.sqrt(p.ratings + 1);
    return [...places].sort((a, b) => score(b) - score(a));
  }, [places, sort]);

  if (!GOOGLE_MAPS_KEY) return <p className="card text-muted">{t.notReady}</p>;

  const nextRadius = RADII[RADII.indexOf(radius) + 1];

  return (
    <div className="flex flex-col gap-4">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(typed.trim());
        }}
      >
        <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id="guide-search"
          type="search"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            if (!e.target.value) setQuery("");
          }}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className="input h-12 rounded-full ps-12 pe-24"
          enterKeyHint="search"
        />
        <button className="btn-primary absolute end-1 top-1 h-10 rounded-full px-4 text-sm">{t.searchGo}</button>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {CUISINES.map((c) => {
          const active = !query && cuisine === c.key;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCuisine(c.key);
                setQuery("");
                setTyped("");
              }}
              className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition ${active ? "border-accent bg-accent/10 text-accent" : "border-line bg-surface hover:border-accent/40"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.art && <img src={c.art} alt="" className="h-6 w-6" />}
              {t.cuisines[c.key]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex rounded-full border border-line bg-surface p-1">
          {(["near", "top"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={sort === k}
              onClick={() => setSort(k)}
              className={`h-8 rounded-full px-3 font-semibold transition ${sort === k ? "bg-accent text-accent-ink" : "text-muted"}`}
            >
              {k === "near" ? t.sortNear : t.sortTop}
            </button>
          ))}
        </div>
        <span className="text-muted">{fill(t.within, { km: String(radius / 1000) })}</span>
      </div>

      {failed && <p className="card text-muted">{t.failed}</p>}
      {!failed && !shown && (
        <ul className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label={t.loading}>
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="skeleton h-64" />
          ))}
        </ul>
      )}
      {shown && shown.length === 0 && <p className="card text-muted">{t.none}</p>}
      {shown && shown.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((p) => (
            <li key={p.id} className="flex flex-col overflow-hidden rounded-3xl border border-line bg-surface">
              <a href={p.website ?? p.mapsUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="relative block aspect-[3/2] max-w-full bg-surface-2">
                {p.photo && (
                  // Google photos can't be cached or resized by us, so a plain lazy img is used.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo.url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                )}
                {p.open != null && (
                  <span className={`absolute start-3 top-3 rounded-full px-2 py-0.5 text-xs font-bold shadow ${p.open ? "bg-positive text-accent-ink" : "bg-background/90 text-muted"}`}>
                    {p.open ? t.open : t.closed}
                  </span>
                )}
              </a>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="min-w-0">
                  <div className="truncate text-lg font-extrabold">{p.name}</div>
                  <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                    {p.rating != null && (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                        {p.rating.toFixed(1)} <span className="font-normal text-muted">({p.ratings.toLocaleString(locale === "ar" ? "ar-EG" : "en")})</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatKm(p.distanceKm, locale)}
                    </span>
                    {p.type && <span>{p.type}</span>}
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="btn-primary h-10 flex-1 text-sm">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      {t.menu}
                    </a>
                  )}
                  {p.mapsUrl && (
                    <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost h-10 flex-1 text-sm">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {t.maps}
                    </a>
                  )}
                </div>
                {p.photo?.by && (
                  <p className="text-[11px] text-muted">
                    {t.photoBy}{" "}
                    {p.photo.byUrl ? (
                      <a href={p.photo.byUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        {p.photo.by}
                      </a>
                    ) : (
                      p.photo.by
                    )}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {shown && nextRadius && (
        <button type="button" className="btn-ghost self-center" onClick={() => setRadius(nextRadius)}>
          {t.farther} ({fill(t.within, { km: String(nextRadius / 1000) })})
        </button>
      )}

      {/* Google requires this attribution wherever Places data is shown without a Google map. */}
      <p className="text-center text-xs text-muted" translate="no">
        {t.source} · Google Maps
      </p>
    </div>
  );
}
