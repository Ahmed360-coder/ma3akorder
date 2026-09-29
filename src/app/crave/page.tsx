import type { Metadata } from "next";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { getCustomerLocation } from "@/lib/location-server";
import { getOpenDishes } from "@/lib/discover";
import { PageTitle } from "@/components/discover/page-title";
import { CraveDeck } from "./crave-deck";

export const metadata: Metadata = { title: "Swipe to crave" };

export default async function CravePage() {
  const { t, locale } = await getDictionary();
  const x = getExtras(locale);
  const { stores, dishes } = await getOpenDishes(t, locale, await getCustomerLocation());

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-28 pt-6">
        <PageTitle title={x.crave.title} subtitle={x.crave.subtitle} art="/art/real/burger.webp" back={x.back} />
        {dishes.length ? (
          <CraveDeck stores={stores} dishes={dishes} locale={locale} x={{ ...x.crave, added: x.addedToCart, viewCart: x.viewCart, otherStore: x.otherStoreInCart }} />
        ) : (
          <p className="card text-center text-muted">{x.noOpen}</p>
        )}
      </main>
    </>
  );
}
