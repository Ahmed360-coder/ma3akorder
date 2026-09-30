import { notFound } from "next/navigation";
import { Bike, Clock, Lock, ShoppingCart } from "lucide-react";
import { Header } from "@/components/header";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { CartBar } from "@/components/cart-bar";
import { Art, NameArt, pickArt } from "@/components/category-icon";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { formatEGP, pickName } from "@/lib/format";
import type { Business, Item } from "@/lib/types";
import { getDemoState } from "@/lib/demo";
import { getCurrentProfile } from "@/lib/profile";
import { AddToCart } from "./add-to-cart";
import { WorthBadge, type ValueScore } from "@/components/worth-badge";
import { HeartButton } from "@/components/discover/heart-button";
import { getExtras } from "@/lib/i18n/extras";

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getDictionary();
  const supabase = await createClient();
  const { data: store } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle<Business>();
  if (!store) notFound();
  // Hidden demo stores stay reachable for the admin only.
  if (store.is_demo && !(await getDemoState(supabase)).showDemo && (await getCurrentProfile()).profile?.role !== "admin") notFound();
  const { data } = await supabase.from("items").select("*").eq("business_id", id).order("sort_order").order("created_at");
  const items = (data ?? []) as Item[];
  const { data: scoreRows } = await supabase.rpc("item_value_scores", { p_business_id: id });
  const scores = new Map(((scoreRows ?? []) as ValueScore[]).map((s) => [s.item_id, s]));
  const name = pickName(locale, store.name_ar, store.name_en);
  const storeInfo = { businessId: store.id, businessName: name, deliveryFee: Number(store.delivery_fee), minOrder: Number(store.min_order) };
  const storeText = `${store.name_en ?? ""} ${store.name_ar}`;
  const storeArt = pickArt(storeText, store.category);

  return (
    <>
      <Header />
      {/* Sold-out flags and prices update live. */}
      <RealtimeRefresh channel={`store-${id}`} tables={[{ table: "items", filter: `business_id=eq.${id}` }]} />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-32 pt-4">
        {/* Store hero: a big picture band, then a white info card sliding over it. */}
        <section className="relative">
          <div className="store-hero relative h-44 overflow-hidden rounded-[2rem] sm:h-56">
            <HeartButton storeId={store.id} labels={getExtras(locale).favorites} className="absolute start-3 top-3 z-10 shadow-md" />
            {store.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <span aria-hidden="true" className="hero-rays" />
                <span aria-hidden="true" className="hero-dots" />
                {storeArt && <Art src={storeArt} className="hero-food absolute end-5 top-3 h-36 w-36 sm:h-44 sm:w-44" />}
              </>
            )}
          </div>
          <div className="card relative -mt-14 mx-3 flex flex-col gap-4 rounded-3xl p-4 sm:mx-6 sm:p-6">
            <div className="flex items-start gap-3">
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt="" className="-mt-10 h-18 w-18 shrink-0 rounded-2xl border-4 border-surface bg-white object-cover shadow-lg" />
              ) : (
                <span className="-mt-10 grid h-18 w-18 shrink-0 place-items-center rounded-2xl border-4 border-surface bg-tile shadow-lg">
                  <NameArt name={storeText} category={store.category} className="h-11 w-11" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{name}</h1>
                <p className="text-sm text-muted">
                  {t.categories[store.category]} · {store.area}
                </p>
              </div>
            </div>
            {store.description && <p className="text-sm leading-relaxed text-muted">{store.description}</p>}
            {/* Three facts people check before ordering, as big readable numbers. */}
            <div className="grid grid-cols-3 divide-x divide-line rounded-2xl bg-surface-2 py-3 text-center rtl:divide-x-reverse">
              <div className="flex flex-col items-center gap-0.5 px-1">
                <Bike className="h-5 w-5 text-accent" aria-hidden="true" />
                <span className="text-sm font-extrabold">{Number(store.delivery_fee) === 0 ? t.ui.freeDelivery : formatEGP(store.delivery_fee, locale)}</span>
                <span className="text-[11px] text-muted">{t.stores.deliveryFee}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 px-1">
                <Clock className="h-5 w-5 text-accent" aria-hidden="true" />
                <span className="text-sm font-extrabold">
                  {store.prep_minutes}–{store.prep_minutes + 15} {t.ui.mins}
                </span>
                <span className="text-[11px] text-muted">{t.stores.prep}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 px-1">
                <ShoppingCart className="h-5 w-5 text-accent" aria-hidden="true" />
                <span className="text-sm font-extrabold">{formatEGP(store.min_order, locale)}</span>
                <span className="text-[11px] text-muted">{t.stores.minOrder}</span>
              </div>
            </div>
          </div>
        </section>

        {!store.is_open && (
          <p className="flex items-center gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" /> {t.stores.storeClosed}
          </p>
        )}

        <h2 className="px-1 text-xl font-extrabold tracking-tight">{t.business.tabs.menu}</h2>
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const soldOut = !item.is_available;
            return (
              <li key={item.id} className={`card flex gap-4 p-3 ${soldOut ? "opacity-50" : ""}`}>
                <div className="flex min-w-0 flex-1 flex-col gap-1 py-1 ps-1">
                  <div className="font-extrabold leading-snug">{pickName(locale, item.name_ar, item.name_en)}</div>
                  {item.description && <div className="line-clamp-2 text-sm text-muted">{item.description}</div>}
                  <WorthBadge score={scores.get(item.id)} unit={item.unit_type} category={store.category} t={t} />
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <div className="text-sm">
                      <b className="text-base text-warm-deep">{formatEGP(item.price, locale)}</b>
                      {!(item.unit_type === "piece" && Number(item.unit_amount) === 1) && (
                        <span className="text-muted">
                          {" "}
                          · {item.unit_amount} {t.business.units[item.unit_type]}
                        </span>
                      )}
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
                  </div>
                </div>
                {/* Food picture on a cream plate, on the reading-end side like the big delivery apps. */}
                <span className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-tile">
                  {item.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photo_url} alt="" loading="lazy" className={item.photo_url.startsWith("/art/") ? "h-24 w-24 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]" : "h-full w-full object-cover"} />
                  ) : (
                    <NameArt name={`${item.name_en ?? ""} ${item.name_ar}`} category={store.category} className="h-20 w-20" />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </main>
      <CartBar label={t.ui.viewCart} itemsLabel={t.ui.items} locale={locale} />
    </>
  );
}
