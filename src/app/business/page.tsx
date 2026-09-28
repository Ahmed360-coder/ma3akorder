import { getDictionary } from "@/lib/i18n/server";
import { getMyBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "@/components/action-button";
import { OrderCard } from "@/components/order-card";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { setOrderStatus } from "@/lib/order-actions";
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

  const groups = [
    { title: t.business.newOrders, orders: list.filter((o) => o.status === "placed") },
    { title: t.business.activeOrders, orders: list.filter((o) => ["accepted", "preparing", "ready", "picked_up"].includes(o.status)) },
    { title: t.business.doneOrders, orders: list.filter((o) => ["delivered", "rejected", "cancelled"].includes(o.status)) },
  ];

  return (
    <>
      <RealtimeRefresh channel={`biz-${business!.id}`} tables={[{ table: "orders", filter: `business_id=eq.${business!.id}` }]} chimeOnInsert />
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
