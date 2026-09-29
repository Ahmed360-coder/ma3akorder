import { cookies } from "next/headers";
import { LOCATION_COOKIE, parseLoc, type Loc } from "./location";

export async function getCustomerLocation(): Promise<Loc | null> {
  return parseLoc((await cookies()).get(LOCATION_COOKIE)?.value);
}
