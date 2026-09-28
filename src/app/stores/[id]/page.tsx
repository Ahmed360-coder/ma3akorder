import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { formatEGP, pickName } from "@/lib/format";
import type { Business, Item } from "@/lib/types";
import { AddToCart } from "./add-to-cart";

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getDictionary();
  const supabase = await createClient();
  const { data: store } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle<Business>();
  if (!store) notFound();
  const { data } = await supabase.from("items").select("*").eq("business_id", id).order("sort_order").order("created_at");
  const items = (data ?? []) as Item[];
  const name = pickName(locale, store.name_ar, store.name_en);
  const storeInfo = { businessId: store.id, businessName: name, deliveryFee: Number(store.delivery_fee), minOrder: Number(store.min_order) };

  return (
    <>
      <Header />
      {/* Sold-out flags and prices update live. */}
      <RealtimeRefresh channel={`store-${id}`} tables={[{ table: "items", filter: `business_id=eq.${id}` }]} />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-24 pt-6">
        <div>
          <h1 className="text-3xl font-bold">{name}</h1>
          <p className="text-muted">
            {t.categories[store.category]} · {store.area} · {t.stores.deliveryFee} {formatEGP(store.delivery_fee, locale)}
            {Number(store.min_order) > 0 && ` · ${t.stores.minOrder} ${formatEGP(store.min_order, locale)}`}
          </p>
          {store.description && <p className="mt-2">{store.description}</p>}
        </div>
        {!store.is_open && <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">{t.stores.storeClosed}</p>}
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const soldOut = !item.is_available;
            return (
              <li key={item.id} className={`card flex items-center gap-4 p-3 ${soldOut ? "opacity-50" : ""}`}>
                {item.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo_url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="h-20 w-20 shrink-0 rounded-xl bg-surface-2" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{pickName(locale, item.name_ar, item.name_en)}</div>
                  {item.description && <div className="line-clamp-2 text-sm text-muted">{item.description}</div>}
                  <div className="mt-1 text-sm">
                    <b>{formatEGP(item.price, locale)}</b>
                    <span className="text-muted">
                      {" "}
                      · {item.unit_amount} {t.business.units[item.unit_type]}
                    </span>
                  </div>
                </div>
                {soldOut ? (
                  <span className="text-sm font-bold text-danger">{t.common.soldOut}</span>
                ) : (
                  store.is_open && (
                    <AddToCart
                      store={storeInfo}
                      line={{ itemId: item.id, name: pickName(locale, item.name_ar, item.name_en), price: Number(item.price), stock: item.stock_count }}
                      label={t.stores.addToCart}
                      replaceText={t.stores.otherStoreInCart}
                    />
                  )
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
