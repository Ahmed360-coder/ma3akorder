import type { Metadata } from "next";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { getCustomerLocation } from "@/lib/location-server";
import { getStoreCards } from "@/lib/stores";
import { PageTitle } from "@/components/discover/page-title";
import { FavoritesList } from "./favorites-list";

export const metadata: Metadata = { title: "Favourites" };

export default async function FavoritesPage() {
  const { t, locale } = await getDictionary();
  const x = getExtras(locale);
  const cards = await getStoreCards(t, locale, await getCustomerLocation());

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-28 pt-6">
        <PageTitle title={x.favorites.title} subtitle={x.favorites.subtitle} art="/art/red_heart.webp" back={x.back} />
        <FavoritesList stores={cards} x={{ ...x.favorites, open: t.common.open, closed: t.common.closed, mins: t.ui.mins }} />
      </main>
    </>
  );
}
