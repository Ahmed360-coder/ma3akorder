import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { ActionButton } from "@/components/action-button";
import { StatusPill } from "@/components/order-card";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile, type Profile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { formatEGP, formatTime } from "@/lib/format";
import type { Business, Order } from "@/lib/types";
import { setBusinessStatus, setHideDemoStores, setProfileStatus } from "./actions";
import { getDemoState } from "@/lib/demo";

export default async function AdminPage() {
  const { t, locale } = await getDictionary();
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "admin") redirect("/account");

  const supabase = await createClient();
  const [{ data: stores }, { data: people }, { data: orders }, demo] = await Promise.all([
    supabase.from("businesses").select("*").eq("status", "pending").order("created_at"),
    supabase.from("profiles").select("*").eq("approval_status", "pending").eq("onboarded", true).order("created_at"),
    supabase.from("orders").select("*, businesses(name_ar)").order("created_at", { ascending: false }).limit(30),
    getDemoState(supabase),
  ]);

  return (
    <>
      <Header />
      <RealtimeRefresh channel="admin" tables={[{ table: "orders" }]} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.admin.title}</h1>

        {/* Admin only: the kit shows sample menus for restaurants that haven't joined yet. */}
        <section className="card flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold">{t.admin.pilotKit}</div>
            <div className="text-sm text-muted">{t.admin.pilotKitBody}</div>
          </div>
          <a href="https://claude.ai/artifact/LzcZcpSpYmo3fmkykdeTEJ" target="_blank" rel="noopener noreferrer" className="btn-primary">
            {t.admin.openPilotKit}
          </a>
        </section>

        <section className="card flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold">{t.admin.demoTitle}</div>
            <div className={`text-sm ${demo.showDemo ? "text-warning" : "text-positive"}`}>
              {demo.showDemo ? t.admin.demoShown : demo.realStores > 0 ? t.admin.demoAutoHidden : t.admin.demoHidden}
            </div>
          </div>
          {demo.realStores === 0 && (
            <ActionButton action={setHideDemoStores.bind(null, !demo.hiddenByAdmin)} className={demo.hiddenByAdmin ? "btn-ghost" : "btn-primary"}>
              {demo.hiddenByAdmin ? t.admin.demoShow : t.admin.demoHide}
            </ActionButton>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-bold">{t.admin.pendingStores}</h2>
          {!stores?.length && <p className="text-muted">{t.admin.nothing}</p>}
          {((stores ?? []) as Business[]).map((b) => (
            <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold">{b.name_ar}</div>
                <div className="text-sm text-muted">
                  {t.categories[b.category]} · {b.area} · <span dir="ltr">{b.phone}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <ActionButton action={setBusinessStatus.bind(null, b.id, "approved")}>{t.admin.approve}</ActionButton>
                <ActionButton action={setBusinessStatus.bind(null, b.id, "rejected")} className="btn-ghost">{t.admin.reject}</ActionButton>
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-bold">{t.admin.pendingPeople}</h2>
          {!people?.length && <p className="text-muted">{t.admin.nothing}</p>}
          {((people ?? []) as Profile[]).map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold">{p.full_name}</div>
                <div className="text-sm text-muted">
                  {t.account.roles[p.role]} · <span dir="ltr">{p.email ?? p.phone}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <ActionButton action={setProfileStatus.bind(null, p.id, "approved")}>{t.admin.approve}</ActionButton>
                <ActionButton action={setProfileStatus.bind(null, p.id, "rejected")} className="btn-ghost">{t.admin.reject}</ActionButton>
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-bold">{t.admin.recentOrders}</h2>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[560px] text-sm">
              <tbody>
                {((orders ?? []) as (Order & { businesses: { name_ar: string } | null })[]).map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0">
                    <td className="p-3 font-mono text-muted">#{o.code}</td>
                    <td className="p-3">{o.businesses?.name_ar}</td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3">{formatEGP(o.total, locale)}</td>
                    <td className="p-3"><StatusPill status={o.status} t={t} /></td>
                    <td className="p-3 text-muted">{formatTime(o.created_at, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
