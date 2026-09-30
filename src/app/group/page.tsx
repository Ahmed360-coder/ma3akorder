import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Header } from "@/components/header";
import { ActionButton } from "@/components/action-button";
import { StoreBadge } from "@/components/category-icon";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { getCurrentProfile } from "@/lib/profile";
import { getCustomerLocation } from "@/lib/location-server";
import { getStoreCards } from "@/lib/stores";
import { PageTitle } from "@/components/discover/page-title";
import { startGroupOrder } from "./actions";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Order together" };

export default async function GroupStartPage() {
  const { t, locale } = await getDictionary();
  const x = getExtras(locale);
  const { user } = await getCurrentProfile();
  const stores = (await getStoreCards(t, locale, await getCustomerLocation())).filter((s) => s.isOpen && s.inRange);

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-28 pt-6">
        <PageTitle title={x.group.title} subtitle={x.group.subtitle} art="/art/real/pizza.webp" back={x.back} />
        {!user ? (
          <div className="card flex items-center justify-between gap-3">
            <p className="text-sm">{x.group.signIn}</p>
            <Link href="/login" className="btn-primary h-10 shrink-0 px-4">{x.group.signInBtn}</Link>
          </div>
        ) : !stores.length ? (
          <EmptyState text={x.noOpen} />
        ) : (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">{x.group.pick}</h2>
            {stores.map((s, i) => (
              <div key={s.id} className="stagger card flex items-center gap-3 p-3" style={{ "--i": i } as React.CSSProperties}>
                <StoreBadge category={s.category} logo={s.logo} name={s.name} className="h-14 w-14 rounded-xl" iconClass="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{s.name}</div>
                  <div className="text-xs text-muted">
                    {s.categoryLabel} · {s.prep} {t.ui.mins}
                    {s.distanceText && ` · ${s.distanceText}`}
                  </div>
                </div>
                <ActionButton action={startGroupOrder.bind(null, s.id)} className="btn-primary h-10 shrink-0 px-3 text-sm">
                  <Users className="h-4 w-4" aria-hidden="true" /> {x.group.start}
                </ActionButton>
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
