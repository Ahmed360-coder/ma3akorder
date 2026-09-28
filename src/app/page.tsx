import Link from "next/link";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const { t } = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const features = [t.features.budget, t.features.worth, t.features.local];

  return (
    <>
      <Header t={t} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pb-16 pt-10">
        <section className="flex flex-col gap-5">
          <span className="w-fit rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">{t.heroNote}</span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">{t.tagline}</h1>
          <div>
            <Link href={user ? "/account" : "/login"} className="btn-primary">
              {user ? t.myAccount : t.getStarted}
            </Link>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <h2 className="mb-1 text-lg font-bold">{f.title}</h2>
              <p className="text-muted">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
