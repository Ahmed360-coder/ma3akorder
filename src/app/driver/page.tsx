import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { Header } from "@/components/header";
import { ActionButton } from "@/components/action-button";
import { OrderCard } from "@/components/order-card";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { formatEGP } from "@/lib/format";
import { mapsLink } from "@/lib/location";
import { claimDelivery, setOrderStatus } from "@/lib/order-actions";
import type { Order, OrderItem } from "@/lib/types";

type Row = Order & { businesses: { name_ar: string; area: string; address: string | null; phone: string | null; lat: number | null; lng: number | null } | null };

export default async function DriverPage() {
  const { t, locale } = await getDictionary();
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile?.onboarded) redirect("/onboarding");
  if (profile.role !== "driver" && profile.role !== "admin") redirect("/account");

  if (profile.approval_status !== "approved") {
    return (
      <>
        <Header />
        <main className="mx-auto w-full max-w-lg px-4 pt-8">
          <p className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-warning">{t.driver.pending}</p>
        </main>
      </>
    );
  }

  const supabase = await createClient();
  const select = "*, businesses(name_ar, area, address, phone, lat, lng)";
  const [{ data: openRows }, { data: mineRows }] = await Promise.all([
    supabase.from("orders").select(select).is("driver_id", null).in("status", ["accepted", "preparing", "ready"]).order("created_at"),
    supabase.from("orders").select(select).eq("driver_id", user.id).in("status", ["accepted", "preparing", "ready", "picked_up"]).order("created_at"),
  ]);
  const open = (openRows ?? []) as Row[];
  const mine = (mineRows ?? []) as Row[];
  const ids = [...open, ...mine].map((o) => o.id);
  const { data: itemRows } = ids.length ? await supabase.from("order_items").select("*").in("order_id", ids) : { data: [] };
  const itemsFor = (id: string) => ((itemRows ?? []) as OrderItem[]).filter((i) => i.order_id === id);

  const pickup = (o: Row) => (
    <p className="text-sm">
      {t.driver.pickupFrom}: <b>{o.businesses?.name_ar}</b> · {o.businesses?.area}
      {o.businesses?.address && ` · ${o.businesses.address}`}
      {o.businesses?.phone && (
        <>
          {" · "}
          <a href={`tel:${o.businesses.phone}`} dir="ltr" className="underline">{o.businesses.phone}</a>
        </>
      )}
      {o.businesses?.lat != null && o.businesses?.lng != null && (
        <>
          {" · "}
          <a href={mapsLink(o.businesses.lat, o.businesses.lng)} target="_blank" rel="noopener noreferrer" className="text-accent underline">
            <MapPin aria-hidden="true" className="inline h-4 w-4" /> {t.location.openMap}
          </a>
        </>
      )}
    </p>
  );

  return (
    <>
      <Header />
      <RealtimeRefresh channel={`driver-${user.id}`} tables={[{ table: "orders" }]} chimeOnInsert={false} />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pb-16 pt-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.driver.title}</h1>

        {mine.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-bold">{t.driver.mine}</h2>
            {mine.map((o) => (
              <OrderCard key={o.id} order={o} items={itemsFor(o.id)} t={t} locale={locale}>
                <div className="flex w-full flex-col gap-2">
                  {pickup(o)}
                  <p className="font-bold text-accent">
                    {t.driver.collect}: {formatEGP(o.total, locale)}
                  </p>
                  {o.status === "ready" && <ActionButton action={setOrderStatus.bind(null, o.id, "picked_up")}>{t.driver.pickedUp}</ActionButton>}
                  {o.status === "picked_up" && <ActionButton action={setOrderStatus.bind(null, o.id, "delivered")}>{t.driver.delivered}</ActionButton>}
                  {(o.status === "accepted" || o.status === "preparing") && <p className="text-sm text-muted">{t.driver.notReady}</p>}
                </div>
              </OrderCard>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="font-bold">{t.driver.available}</h2>
          {open.length === 0 && <p className="card text-muted">{t.driver.none}</p>}
          {open.map((o) => (
            <OrderCard key={o.id} order={o} t={t} locale={locale}>
              <div className="flex w-full flex-col gap-2">
                {pickup(o)}
                <ActionButton action={claimDelivery.bind(null, o.id)}>{t.driver.take}</ActionButton>
              </div>
            </OrderCard>
          ))}
        </section>
      </main>
    </>
  );
}
