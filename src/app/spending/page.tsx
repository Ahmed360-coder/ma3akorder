import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { getSpendingOrders, monthStart } from "@/lib/spending";
import { fill, formatEGP, pickName } from "@/lib/format";
import { setBudget } from "./actions";

export default async function SpendingPage() {
  const { t, locale } = await getDictionary();
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");

  const orders = await getSpendingOrders(user.id);
  const start = monthStart();
  const thisMonth = orders.filter((o) => new Date(o.created_at) >= start);
  const spent = thisMonth.reduce((n, o) => n + Number(o.total), 0);
  const delivery = thisMonth.reduce((n, o) => n + Number(o.delivery_fee), 0);
  const budget = profile?.monthly_budget ? Number(profile.monthly_budget) : null;
  const pct = budget ? Math.round((spent / budget) * 100) : null;

  const byStore = new Map<string, { name: string; total: number }>();
  for (const o of thisMonth) {
    const row = byStore.get(o.business_id) ?? { name: pickName(locale, o.businesses?.name_ar, o.businesses?.name_en), total: 0 };
    row.total += Number(o.total);
    byStore.set(o.business_id, row);
  }
  const stores = [...byStore.values()].sort((a, b) => b.total - a.total);

  const months = Array.from({ length: 6 }, (_, i) => {
    const from = monthStart(i - 5);
    const to = monthStart(i - 4);
    const total = orders.filter((o) => new Date(o.created_at) >= from && new Date(o.created_at) < to).reduce((n, o) => n + Number(o.total), 0);
    return { label: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { month: "short" }).format(from), total };
  });
  const maxMonth = Math.max(...months.map((m) => m.total), budget ?? 0, 1);

  const barTone = pct === null ? "bg-accent" : pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-positive";

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-16 pt-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.spending.title}</h1>

        <section className="card flex flex-col gap-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-sm text-muted">{t.spending.thisMonth}</div>
              <div className="text-3xl font-bold">{formatEGP(spent, locale)}</div>
            </div>
            {budget !== null && (
              <div className="text-end text-sm">
                <div className="text-muted">{t.spending.budget}: {formatEGP(budget, locale)}</div>
                <div className={spent > budget ? "font-bold text-danger" : "font-bold text-positive"}>
                  {spent > budget ? `${formatEGP(spent - budget, locale)} ${t.spending.over}` : `${formatEGP(budget - spent, locale)} ${t.spending.left}`}
                </div>
              </div>
            )}
          </div>
          {budget !== null && (
            <div className="h-3 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full ${barTone}`} style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
            </div>
          )}
          {pct !== null && pct >= 100 && <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{t.spending.warn100}</p>}
          {pct !== null && pct >= 80 && pct < 100 && <p className="rounded-xl bg-warning/10 p-3 text-sm text-warning">{fill(t.spending.warn80, { n: pct })}</p>}
          <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-sm">
            <div>
              <dt className="text-muted">{t.spending.orders}</dt>
              <dd className="font-bold">{thisMonth.length}</dd>
            </div>
            <div>
              <dt className="text-muted">{t.spending.avgOrder}</dt>
              <dd className="font-bold">{formatEGP(thisMonth.length ? spent / thisMonth.length : 0, locale)}</dd>
            </div>
            <div>
              <dt className="text-muted">{t.spending.deliveryPaid}</dt>
              <dd className="font-bold">{formatEGP(delivery, locale)}</dd>
            </div>
          </dl>
        </section>

        <form action={setBudget} className="card flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {budget === null ? t.spending.setBudget : t.spending.budget}
            <span className="font-normal text-muted">{t.spending.budgetHint}</span>
            <input name="budget" type="number" min="0" step="50" inputMode="numeric" className="input" defaultValue={budget ?? ""} placeholder="1500" />
          </label>
          <div className="flex gap-2">
            <button className="btn-primary flex-1">{t.spending.save}</button>
            {budget !== null && (
              <button name="remove" value="1" className="btn-ghost">{t.spending.remove}</button>
            )}
          </div>
        </form>

        <section className="card flex flex-col gap-3">
          <h2 className="font-bold">{t.spending.byStore}</h2>
          {stores.length === 0 && <p className="text-sm text-muted">{t.spending.none}</p>}
          {stores.map((s) => (
            <div key={s.name} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-bold">{formatEGP(s.total, locale)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(s.total / spent) * 100}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className="card flex flex-col gap-3">
          <h2 className="font-bold">{t.spending.byMonth}</h2>
          <div className="flex h-40 items-end gap-2">
            {months.map((m, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-muted">{m.total ? formatEGP(m.total, locale) : ""}</span>
                <div className={`w-full rounded-t-md ${i === 5 ? "bg-accent" : "bg-surface-2"}`} style={{ height: `${Math.max((m.total / maxMonth) * 100, 2)}%` }} />
                <span className="text-xs text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
