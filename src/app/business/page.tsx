import { getDictionary } from "@/lib/i18n/server";
import { getMyBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "@/components/action-button";
import { OrderCard } from "@/components/order-card";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { setOrderStatus } from "@/lib/order-actions";
import { formatEGP } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

export default async function BusinessOrdersPage() {
  const { t, locale } = await getDictionary();
  const business = await getMyBusiness();
  const supabase = await createClient();

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("business_id", business!.id)
    .or(`status.in.(placed,accepted,preparing,ready,picked_up),created_at.gte.${since.toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(100);
  const list = (orders ?? []) as Order[];
  const { data: itemRows } = list.length
    ? await supabase.from("order_items").select("*").in("order_id", list.map((o) => o.id))
    : { data: [] };
  const itemsFor = (id: string) => ((itemRows ?? []) as OrderItem[]).filter((i) => i.order_id === id);

  const deliveredToday = list.filter((o) => o.status === "delivered" && new Date(o.created_at) >= since);
  const salesToday = deliveredToday.reduce((n, o) => n + Number(o.subtotal), 0);
  const itemCounts = new Map<string, number>();
  for (const o of deliveredToday) for (const i of itemsFor(o.id)) itemCounts.set(i.name, (itemCounts.get(i.name) ?? 0) + i.quantity);
  const topItem = [...itemCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const groups = [
    { title: t.business.newOrders, orders: list.filter((o) => o.status === "placed") },
    { title: t.business.activeOrders, orders: list.filter((o) => ["accepted", "preparing", "ready", "picked_up"].includes(o.status)) },
    { title: t.business.doneOrders, orders: list.filter((o) => ["delivered", "rejected", "cancelled"].includes(o.status)) },
  ];

  return (
    <>
      <RealtimeRefresh channel={`biz-${business!.id}`} tables={[{ table: "orders", filter: `business_id=eq.${business!.id}` }]} chimeOnInsert />
      <section className="card grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <div className="text-sm text-muted">{t.sales.today}</div>
          <div className="text-xl font-bold">{formatEGP(salesToday, locale)}</div>
        </div>
        <div>
          <div className="text-sm text-muted">{t.sales.orders}</div>
          <div className="text-xl font-bold">{deliveredToday.length}</div>
        </div>
        <div>
          <div className="text-sm text-muted">{t.sales.avg}</div>
          <div className="text-xl font-bold">{formatEGP(deliveredToday.length ? salesToday / deliveredToday.length : 0, locale)}</div>
        </div>
        <div>
          <div className="text-sm text-muted">{t.sales.top}</div>
          <div className="truncate text-xl font-bold">{topItem ? `${topItem[0]} ×${topItem[1]}` : "—"}</div>
        </div>
      </section>
      <p className="text-xs text-muted">{t.business.soundHint}</p>
      {list.length === 0 && <p className="card text-muted">{t.business.noOrders}</p>}
      {list.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {groups.map((g) => (
            <section key={g.title} className="flex flex-col gap-3">
              <h2 className="font-bold">
                {g.title} <span className="text-muted">({g.orders.length})</span>
              </h2>
              {g.orders.map((o) => (
                <OrderCard key={o.id} order={o} items={itemsFor(o.id)} t={t} locale={locale}>
                  {o.status === "placed" && (
                    <>
                      <ActionButton action={setOrderStatus.bind(null, o.id, "accepted")}>{t.business.accept}</ActionButton>
                      <ActionButton action={setOrderStatus.bind(null, o.id, "rejected")} className="btn-ghost" confirmText={`${t.business.reject}?`}>
                        {t.business.reject}
                      </ActionButton>
                    </>
                  )}
                  {o.status === "accepted" && <ActionButton action={setOrderStatus.bind(null, o.id, "preparing")}>{t.business.preparing}</ActionButton>}
                  {(o.status === "accepted" || o.status === "preparing") && (
                    <ActionButton action={setOrderStatus.bind(null, o.id, "ready")} className={o.status === "preparing" ? "btn-primary" : "btn-ghost"}>
                      {t.business.ready}
                    </ActionButton>
                  )}
                </OrderCard>
              ))}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
