import type { Metadata } from "next";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { getCustomerLocation } from "@/lib/location-server";
import { getOpenDishes } from "@/lib/discover";
import { PageTitle } from "@/components/discover/page-title";
import { SpinMachine } from "./spin-machine";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Spin & Eat" };

export default async function SpinPage() {
  const { t, locale } = await getDictionary();
  const x = getExtras(locale);
  const { stores, dishes } = await getOpenDishes(t, locale, await getCustomerLocation());

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-28 pt-6">
        <PageTitle title={x.spin.title} subtitle={x.spin.subtitle} art="/art/slot_machine.webp" back={x.back} />
        {dishes.length ? (
          <SpinMachine stores={stores} dishes={dishes} locale={locale} x={{ ...x.spin, noOpen: x.noOpen, added: x.addedToCart, viewCart: x.viewCart, otherStore: x.otherStoreInCart }} />
        ) : (
          <EmptyState text={x.noOpen} />
        )}
      </main>
    </>
  );
}
