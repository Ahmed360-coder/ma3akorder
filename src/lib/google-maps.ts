"use client";

// Loads the Google Maps JavaScript API once per page, only when a map is actually shown.
let loading: Promise<typeof google.maps> | null = null;

// Google calls gm_authFailure when the key is rejected (billing off, wrong site, API not enabled).
let authFailed = false;
const authListeners = new Set<() => void>();
export function onMapsAuthFailure(fn: () => void) {
  if (authFailed) fn();
  authListeners.add(fn);
  return () => {
    authListeners.delete(fn);
  };
}

export function loadGoogleMaps(key: string, language: string): Promise<typeof google.maps> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const cb = "__m3akMapsReady";
    (window as unknown as Record<string, () => void>).gm_authFailure = () => {
      authFailed = true;
      authListeners.forEach((fn) => fn());
    };
    (window as unknown as Record<string, () => void>)[cb] = () => resolve(window.google.maps);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&language=${language}&region=EG&callback=${cb}`;
    s.async = true;
    s.onerror = () => {
      loading = null;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}
