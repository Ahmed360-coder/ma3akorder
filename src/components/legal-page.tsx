import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { legal } from "@/lib/i18n/legal";
import { LEGAL_UPDATED } from "@/lib/site";

export async function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { locale } = await getDictionary();
  const L = legal[locale];
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-16 pt-8">
        <div>
          <h1 className="text-3xl font-bold">{kind === "privacy" ? L.privacyTitle : L.termsTitle}</h1>
          <p className="text-sm text-muted">
            {L.updated}: {LEGAL_UPDATED}
          </p>
        </div>
        {L[kind].map((s) => (
          <section key={s.h} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">{s.h}</h2>
            {s.p.map((p) => (
              <p key={p} className="leading-relaxed text-muted">{p}</p>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}
