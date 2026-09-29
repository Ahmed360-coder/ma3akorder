import { Header } from "@/components/header";
import { LocationPicker } from "@/components/location-picker";
import { getDictionary } from "@/lib/i18n/server";
import { getCustomerLocation } from "@/lib/location-server";
import { NearbyList } from "./nearby-list";

export const metadata = { title: "Restaurant guide · M3akOrder" };

// A directory of real restaurants from Google. Kept apart from M3akOrder partner stores,
// because ordering from these happens on the restaurant's own site.
export default async function NearbyPage() {
  const { t, locale } = await getDictionary();
  const loc = await getCustomerLocation();
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-28 pt-6">
        <h1 className="text-2xl font-extrabold">{t.nearby.guide}</h1>
        <p className="text-sm text-muted">{t.nearby.intro}</p>
        <LocationPicker t={t.location} locale={locale} current={loc} />
        {loc ? <NearbyList t={t.nearby} locale={locale} center={{ lat: loc.lat, lng: loc.lng }} /> : <p className="text-muted">{t.nearby.needLocation}</p>}
      </main>
    </>
  );
}
