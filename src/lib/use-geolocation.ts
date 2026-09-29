"use client";

import { useCallback, useState } from "react";

export type GeoError = "denied" | "unavailable";

// Asks the browser for the phone's position. Browsers only allow this on https (the live site) or localhost.
export function useGeolocation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<GeoError | null>(null);
  const locate = useCallback(
    () =>
      new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!("geolocation" in navigator)) {
          setError("unavailable");
          return resolve(null);
        }
        setBusy(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setBusy(false);
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => {
            setBusy(false);
            setError(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5 * 60 * 1000 },
        );
      }),
    [],
  );
  return { locate, busy, error };
}
