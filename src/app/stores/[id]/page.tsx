import { notFound } from "next/navigation";
import { Bike, Clock, Lock, ShoppingCart } from "lucide-react";
import { Header } from "@/components/header";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { CartBar } from "@/components/cart-bar";
import { CategoryIcon, CATEGORY_TINT } from "@/components/category-icon";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { formatEGP, pickName } from "@/lib/format";
import type { Business, Item } from "@/lib/types";
import { AddToCart } from "./add-to-cart";
import { WorthBadge, type ValueScore } from "@/components/worth-badge";

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getDictionary();
  const supabase = await createClient();
  const { data: store } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle<Business>();
  if (!store) notFound();
  const { data } = await supabase.from("items").select("*").eq("business_id", id).order("sort_order").order("created_at");
  const items = (data ?? []) as Item[];
  const { data: scoreRows } = await supabase.rpc("item_value_scores", { p_business_id: id });
  const scores = new Map(((scoreRows ?? []) as ValueScore[]).map((s) => [s.item_id, s]));
  const name = pickName(locale, store.name_ar, store.name_en);
  const storeInfo = { businessId: store.id, businessName: name, deliveryFee: Number(store.delivery_fee), minOrder: Number(store.min_order) };
  const tint = CATEGORY_TINT[store.category];

  return (
    <>
      <Header />
      {/* Sold-out flags and prices update live. */}
      <RealtimeRefresh channel={`store-${id}`} tables={[{ table: "items", filter: `business_id=eq.${id}` }]} />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-28 pt-6">
        <section
          className="relative isolate overflow-hidden rounded-3xl border border-line p-5 sm:p-7"
          style={{ background: `radial-gradient(120% 120% at 100% 0%, ${tint}40, transparent 55%), var(--surface)` }}
        >
          <CategoryIcon category={store.category} className="absolute -bottom-8 -end-6 -z-10 h-44 w-44 opacity-10" style={{ color: tint }} strokeWidth={1.2} />
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-background/60 backdrop-blur" style={{ color: tint }}>
              <CategoryIcon category={store.category} className="h-8 w-8" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold sm:text-3xl">{name}</h1>
              <p className="text-sm text-muted">
                {t.categories[store.category]} · {store.area}
              </p>
            </div>
          </div>
          {store.description && <p className="mt-4 text-sm leading-relaxed">{store.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="chip h-8 bg-background/50">
              <Bike className="h-4 w-4" aria-hidden="true" /> {t.stores.deliveryFee} {formatEGP(store.delivery_fee, locale)}
            </span>
            <span className="chip h-8 bg-background/50">
              <Clock className="h-4 w-4" aria-hidden="true" /> {store.prep_minutes} {t.stores.prep}
            </span>
            {Number(store.min_order) > 0 && (
              <span className="chip h-8 bg-background/50">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" /> {t.stores.minOrder} {formatEGP(store.min_order, locale)}
              </span>
            )}
          </div>
        </section>

        {!store.is_open && (
          <p className="flex items-center gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" /> {t.stores.storeClosed}
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {items.map((item, i) => {
            const soldOut = !item.is_available;
            return (
              <li key={item.id} className={`card stagger flex items-center gap-4 p-3 ${soldOut ? "opacity-50" : ""}`} style={{ "--i": i } as React.CSSProperties}>
                {item.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo_url} alt="" loading="lazy" className="h-22 w-22 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="grid h-22 w-22 shrink-0 place-items-center rounded-xl" style={{ background: `linear-gradient(135deg, ${tint}30, ${tint}08)`, color: tint }}>
                    <CategoryIcon category={store.category} className="h-8 w-8 opacity-80" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{pickName(locale, item.name_ar, item.name_en)}</div>
                  {item.description && <div className="line-clamp-2 text-sm text-muted">{item.description}</div>}
                  <div className="mt-1 text-sm">
                    <b className="text-accent">{formatEGP(item.price, locale)}</b>
                    <span className="text-muted">
                      {" "}
                      · {item.unit_amount} {t.business.units[item.unit_type]}
                    </span>
                  </div>
                  <WorthBadge score={scores.get(item.id)} unit={item.unit_type} category={store.category} t={t} />
                </div>
                {soldOut ? (
                  <span className="rounded-full bg-danger/15 px-2.5 py-1 text-xs font-bold text-danger">{t.common.soldOut}</span>
                ) : (
                  store.is_open && (
                    <AddToCart
                      store={storeInfo}
                      line={{ itemId: item.id, name: pickName(locale, item.name_ar, item.name_en), price: Number(item.price), stock: item.stock_count }}
                      label={t.stores.addToCart}
                      replaceText={t.stores.otherStoreInCart}
                      qtyLabels={{ addOne: t.ui.addOne, removeOne: t.ui.removeOne, removeItem: t.ui.removeItem }}
                    />
                  )
                )}
              </li>
            );
          })}
        </ul>
      </main>
      <CartBar label={t.ui.viewCart} itemsLabel={t.ui.items} locale={locale} />
    </>
  );
}
