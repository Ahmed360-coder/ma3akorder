"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, onMapsAuthFailure } from "@/lib/google-maps";
import { GOOGLE_MAPS_KEY } from "@/lib/site";

export const mapsEnabled = GOOGLE_MAPS_KEY != null;

// A Google map with a pin fixed in the middle: people drag the map until the pin sits on their door,
// like the big delivery apps. Calls onChange with the centre when the map stops after a drag.
export function MapPin({
  value,
  onChange,
  locale,
  className = "h-64",
}: {
  value: { lat: number; lng: number };
  onChange: (pos: { lat: number; lng: number }) => void;
  locale: "ar" | "en";
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const changed = useRef(onChange);
  const [failed, setFailed] = useState(false);
  changed.current = onChange;

  useEffect(() => onMapsAuthFailure(() => setFailed(true)), []);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !box.current) return;
    let cancelled = false;
    loadGoogleMaps(GOOGLE_MAPS_KEY, locale)
      .then((maps) => {
        if (cancelled || !box.current) return;
        map.current = new maps.Map(box.current, {
          center: value,
          zoom: 17,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        // Only report after the person moves the map, so just opening it never sets a spot.
        let moved = false;
        map.current.addListener("dragstart", () => (moved = true));
        map.current.addListener("idle", () => {
          if (!moved) return;
          const c = map.current?.getCenter();
          if (c) changed.current({ lat: Number(c.lat().toFixed(6)), lng: Number(c.lng().toFixed(6)) });
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
    // The map is created once; later value changes move it below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Recentre when the value comes from outside (GPS button, area list), not from dragging.
  useEffect(() => {
    const c = map.current?.getCenter();
    if (map.current && c && (Math.abs(c.lat() - value.lat) > 1e-5 || Math.abs(c.lng() - value.lng) > 1e-5)) {
      map.current.panTo(value);
    }
  }, [value]);

  if (!GOOGLE_MAPS_KEY || failed) return null;
  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-line ${className}`}>
      <div ref={box} className="absolute inset-0" />
      {/* The pin: its tip marks the map centre. */}
      <svg aria-hidden="true" viewBox="0 0 24 36" className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-7 -translate-x-1/2 -translate-y-full drop-shadow-md">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="var(--accent, #12a150)" />
        <circle cx="12" cy="12" r="4.5" fill="#fff" />
      </svg>
    </div>
  );
}
