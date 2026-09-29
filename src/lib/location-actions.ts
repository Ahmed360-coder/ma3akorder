"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCATION_COOKIE, parseLoc, type Loc } from "./location";

// Saved in a cookie on the customer's own phone only, so the store list can be sorted by distance.
export async function setMyLocation(loc: Loc) {
  const clean = parseLoc(JSON.stringify({ lat: Number(loc.lat.toFixed(4)), lng: Number(loc.lng.toFixed(4)), label: loc.label, precise: loc.precise }));
  if (!clean) return { error: "bad location" };
  (await cookies()).set(LOCATION_COOKIE, JSON.stringify(clean), { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { error: null };
}

export async function clearMyLocation() {
  (await cookies()).delete(LOCATION_COOKIE);
  revalidatePath("/", "layout");
}
