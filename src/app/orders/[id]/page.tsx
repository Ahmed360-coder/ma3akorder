import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/header";
import { ActionButton } from "@/components/action-button";
import { OrderCard } from "@/components/order-card";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { formatTime, pickName } from "@/lib/format";
import { setOrderStatus } from "@/lib/order-actions";
import type { Order, OrderEvent, OrderItem, OrderStatus } from "@/lib/types";
import { ReorderButton } from "./reorder-button";
import { RatingForm } from "./rating-form";

const STEPS: OrderStatus[] = ["placed", "accepted", "preparing", "ready", "picked_up", "delivered"];

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getDictionary();
  const { user } = await getCurrentProfile();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, businesses(id, name_ar, name_en, delivery_fee, min_order)").eq("id", id).maybeSingle();
  if (!order) notFound();
  const o = order as Order & { businesses: { id: string; name_ar: string; name_en: string | null; delivery_fee: number; min_order: number } };
  const [{ data: items }, { data: events }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("order_events").select("*").eq("order_id", id).order("created_at"),
  ]);
  let driverName: string | null = null;
  if (o.driver_id) {
    const { data } = await supabase.from("profiles").select("full_name").eq("id", o.driver_id).maybeSingle();
    driverName = data?.full_name ?? null;
  }

  const { data: myRatings } = await supabase.from("ratings").select("target").eq("order_id", id);
  const rated = new Set((myRatings ?? []).map((r) => r.target as string));
  const canRate = o.status === "delivered" && o.customer_id === user.id;
  const ratingLabels = { comment: t.rating.comment, send: t.rating.send, thanks: t.rating.thanks, stars: t.rating.stars };

  const failed = o.status === "rejected" || o.status === "cancelled";
  const reached = STEPS.indexOf(o.status);
  const storeName = pickName(locale, o.businesses.name_ar, o.businesses.name_en);

  return (
    <>
      <Header />
      <RealtimeRefresh channel={`order-${id}`} tables={[{ table: "orders", filter: `id=eq.${id}` }, { table: "order_events", filter: `order_id=eq.${id}` }]} />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-16 pt-6">
        <div>
          <p className="text-sm text-muted">{t.orders.store}</p>
          <h1 className="text-2xl font-bold">{storeName}</h1>
        </div>

        {!failed && (
          <ol className="card flex flex-col gap-3">
            <li aria-hidden="true" className="mb-1 h-2 overflow-hidden rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(8, (reached / (STEPS.length - 1)) * 100)}%`, background: "linear-gradient(90deg, var(--accent-2), var(--accent))" }}
              />
            </li>
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                    i < reached ? "bg-positive text-accent-ink" : i === reached ? "bg-accent text-accent-ink ring-4 ring-accent/25 animate-pulse" : "bg-surface-2 text-muted"
                  }`}
                >
                  {i < reached ? "✓" : i + 1}
                </span>
                <span className={i <= reached ? "font-bold" : "text-muted"}>{t.statuses[s]}</span>
              </li>
            ))}
            {driverName && (
              <li className="border-t border-line pt-3 text-sm text-muted">
                {t.orders.driver}: <b className="text-foreground">{driverName}</b>
              </li>
            )}
          </ol>
        )}

        <OrderCard order={o} items={(items ?? []) as OrderItem[]} t={t} locale={locale} showAddress={false}>
          {o.status === "placed" && (
            <ActionButton action={setOrderStatus.bind(null, o.id, "cancelled")} className="btn-ghost" confirmText={`${t.orders.cancel}?`}>
              {t.orders.cancel}
            </ActionButton>
          )}
          {(o.status === "delivered" || failed) && (
            <ReorderButton
              label={t.orders.reorder}
              store={{ businessId: o.businesses.id, businessName: storeName, deliveryFee: Number(o.businesses.delivery_fee), minOrder: Number(o.businesses.min_order) }}
              lines={((items ?? []) as OrderItem[]).filter((i) => i.item_id).map((i) => ({ itemId: i.item_id!, name: i.name, price: Number(i.unit_price), qty: i.quantity, stock: null }))}
            />
          )}
        </OrderCard>

        {canRate && !rated.has("business") && <RatingForm orderId={o.id} target="business" title={t.rating.rateStore} labels={ratingLabels} />}
        {canRate && o.driver_id && !rated.has("driver") && <RatingForm orderId={o.id} target="driver" title={t.rating.rateDriver} labels={ratingLabels} />}

        <section className="flex flex-col gap-2">
          <h2 className="font-bold">{t.orders.timeline}</h2>
          <ul className="flex flex-col gap-1 text-sm text-muted">
            {((events ?? []) as OrderEvent[]).map((e) => (
              <li key={e.id}>
                {formatTime(e.created_at, locale)} · {e.note === "driver assigned" ? `${t.orders.driver} ✓` : t.statuses[e.status]}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
