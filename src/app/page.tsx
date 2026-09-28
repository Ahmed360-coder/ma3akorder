import Link from "next/link";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { formatEGP, pickName } from "@/lib/format";
import type { Business } from "@/lib/types";

export default async function Home() {
  const { t, locale } = await getDictionary();
  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("*").eq("status", "approved").order("is_open", { ascending: false }).order("name_ar");
  const stores = (data ?? []) as Business[];
  const { data: ratingRows } = await supabase.from("ratings").select("business_id, stars").eq("target", "business");
  const ratings = new Map<string, { sum: number; n: number }>();
  for (const r of ratingRows ?? []) {
    const cur = ratings.get(r.business_id) ?? { sum: 0, n: 0 };
    ratings.set(r.business_id, { sum: cur.sum + r.stars, n: cur.n + 1 });
  }

  const features = [t.features.budget, t.features.worth, t.features.local];

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16 pt-8">
        <section className="flex flex-col gap-4">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">{t.tagline}</h1>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{t.stores.title}</h2>
          {stores.length === 0 && <p className="card text-muted">{t.stores.none}</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => (
              <Link key={s.id} href={`/stores/${s.id}`} className={`card flex flex-col gap-2 transition hover:border-accent ${s.is_open ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg font-bold">{pickName(locale, s.name_ar, s.name_en)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.is_open ? "bg-positive/15 text-positive" : "bg-surface-2 text-muted"}`}>
                    {s.is_open ? t.common.open : t.common.closed}
                  </span>
                </div>
                <span className="text-sm text-muted">
                  {t.categories[s.category]} · {s.area}
                  {ratings.get(s.id) && (
                    <>
                      {" · "}
                      <span className="text-accent">★</span> {(ratings.get(s.id)!.sum / ratings.get(s.id)!.n).toFixed(1)} ({ratings.get(s.id)!.n})
                    </>
                  )}
                </span>
                <span className="text-sm text-muted">
                  {t.stores.deliveryFee} {formatEGP(s.delivery_fee, locale)} · {s.prep_minutes} {t.stores.prep}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <h2 className="mb-1 font-bold">{f.title}</h2>
              <p className="text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
