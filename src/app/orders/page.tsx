import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { StatusPill } from "@/components/order-card";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { formatEGP, formatTime, pickName } from "@/lib/format";
import type { Order } from "@/lib/types";

export default async function OrdersPage() {
  const { t, locale } = await getDictionary();
  const { user } = await getCurrentProfile();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, businesses(name_ar, name_en)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const orders = (data ?? []) as (Order & { businesses: { name_ar: string; name_en: string | null } | null })[];

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 pb-16 pt-6">
        <h1 className="mb-2 text-2xl font-bold">{t.orders.title}</h1>
        {orders.length === 0 && <p className="card text-muted">{t.orders.none}</p>}
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="card flex flex-col gap-1 hover:border-accent">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{pickName(locale, o.businesses?.name_ar, o.businesses?.name_en)}</span>
              <StatusPill status={o.status} t={t} />
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>{formatTime(o.created_at, locale)}</span>
              <span>{formatEGP(o.total, locale)}</span>
            </div>
          </Link>
        ))}
      </main>
    </>
  );
}
