import type { Metadata } from "next";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { getCustomerLocation } from "@/lib/location-server";
import { getOpenDishes } from "@/lib/discover";
import { PageTitle } from "@/components/discover/page-title";
import { VoiceOrder } from "./voice-order";

export const metadata: Metadata = { title: "Voice order" };

export default async function VoicePage() {
  const { t, locale } = await getDictionary();
  const x = getExtras(locale);
  const { stores, dishes } = await getOpenDishes(t, locale, await getCustomerLocation());

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-28 pt-6">
        <PageTitle title={x.voice.title} subtitle={x.voice.subtitle} art="/art/real/coffee.webp" back={x.back} />
        <VoiceOrder stores={stores} dishes={dishes} locale={locale} x={{ ...x.voice, noOpen: x.noOpen, viewCart: x.viewCart, otherStore: x.otherStoreInCart }} />
      </main>
    </>
  );
}
