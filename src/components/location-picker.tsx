"use client";

import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { AREAS, type Loc } from "@/lib/location";
import { setMyLocation } from "@/lib/location-actions";
import { useGeolocation } from "@/lib/use-geolocation";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { MapPin, mapsEnabled } from "./map-pin";

// "Deliver to" bar: shares the phone's location, or falls back to picking an area.
// Self-contained so it can be placed anywhere (header, home, cart).
export function LocationPicker({
  t,
  locale,
  current,
  startOpen,
  onDone,
}: {
  t: Dictionary["location"];
  locale: "ar" | "en";
  current: Loc | null;
  startOpen?: boolean;
  onDone?: () => void;
}) {
  const { locate, busy, error } = useGeolocation();
  const [open, setOpen] = useState(startOpen || !current);
  const [pending, start] = useTransition();
  // With Google Maps on, a spot is first shown on the map to fine-tune, then confirmed.
  const [draft, setDraft] = useState<Loc | null>(null);

  const save = (loc: Loc) =>
    start(async () => {
      await setMyLocation(loc);
      setDraft(null);
      setOpen(false);
      onDone?.();
    });
  const propose = (loc: Loc) => (mapsEnabled ? setDraft(loc) : save(loc));

  const useMine = async () => {
    const pos = await locate();
    if (pos) propose({ ...pos, label: t.myLocation, precise: true });
  };

  const pickArea = (key: string) => {
    const a = AREAS.find((x) => x.key === key);
    if (a) propose({ lat: a.lat, lng: a.lng, label: locale === "ar" ? a.ar : a.en });
  };

  return (
    <div className="card flex flex-col gap-3" data-location-picker>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
          <span className="text-sm text-muted">{t.deliverTo}</span>
          <span className="truncate font-bold">{current?.label ?? t.noLocation}</span>
        </div>
        {current && !open && (
          <button type="button" className="text-sm font-semibold text-accent" onClick={() => setOpen(true)}>
            {t.change}
          </button>
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-primary sm:flex-1" onClick={useMine} disabled={busy || pending}>
            {busy ? t.finding : pending ? "…" : t.useMine}
          </button>
          <select className="input sm:flex-1" defaultValue="" onChange={(e) => pickArea(e.target.value)} disabled={pending} aria-label={t.pickArea}>
            <option value="" disabled>
              {t.pickArea}
            </option>
            {AREAS.map((a) => (
              <option key={a.key} value={a.key}>
                {locale === "ar" ? a.ar : a.en}
              </option>
            ))}
          </select>
        </div>
      )}
      {open && draft && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{t.movePin}</p>
          <MapPin value={draft} locale={locale} onChange={(pos) => setDraft((d) => (d ? { ...d, ...pos } : d))} />
          <button type="button" className="btn-primary" disabled={pending} onClick={() => save({ ...draft, precise: true })}>
            {pending ? "…" : t.confirmSpot}
          </button>
        </div>
      )}
      {error && open && <p role="alert" className="text-sm text-warning">{error === "denied" ? t.denied : t.unavailable}</p>}
    </div>
  );
}
