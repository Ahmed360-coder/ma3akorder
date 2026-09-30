import type { Metadata } from "next";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { getCustomerLocation } from "@/lib/location-server";
import { getOpenDishes } from "@/lib/discover";
import { PageTitle } from "@/components/discover/page-title";
import { MealBuilder } from "./meal-builder";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Feed us for…" };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ people?: string; budget?: string }> }) {
  const sp = await searchParams;
  const start = { people: Math.min(20, Math.max(1, Number(sp.people) || 2)), budget: Math.min(3000, Math.max(50, Number(sp.budget) || 300)) };
  const { t, locale } = await getDictionary();
  const x = getExtras(locale);
  const { stores, dishes } = await getOpenDishes(t, locale, await getCustomerLocation());

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-28 pt-6">
        <PageTitle title={x.feed.title} subtitle={x.feed.subtitle} art="/art/money_bag.webp" back={x.back} />
        {dishes.length ? (
          <MealBuilder start={start} stores={stores} dishes={dishes} locale={locale} x={{ ...x.feed, added: x.addedToCart, viewCart: x.viewCart, otherStore: x.otherStoreInCart, mins: t.ui.mins }} />
        ) : (
          <EmptyState text={x.noOpen} />
        )}
      </main>
    </>
  );
}
