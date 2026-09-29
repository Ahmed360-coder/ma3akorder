"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronDown, MapPin, ShoppingBag, Star, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { LogoMark } from "@/components/logo";
import { SideMenuButton } from "@/components/side-menu";
import { Art, CATEGORY_ART, StoreBadge } from "@/components/category-icon";
import type { BusinessCategory } from "@/lib/types";
import type { StoreCard } from "@/lib/stores";
import type { Loc } from "@/lib/location";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { LocationPicker } from "@/components/location-picker";
import { SearchLauncher } from "@/components/search-overlay";
import type { SearchLabels } from "@/app/search/search-screen";

export type HomeLabels = {
  brand: string;
  demo: string;
  deliverTo: string;
  area: string;
  search: string;
  cart: string;
  orderAgain: string;
  nearYou: string;
  none: string;
  noMatch: string;
  open: string;
  closed: string;
  openCount: string;
  soon: string;
  mins: string;
  freeDelivery: string;
  all: string;
  tiles: Record<BusinessCategory, string>;
  promos: { title: string; body: string; href?: string }[];
};

const CATEGORIES: BusinessCategory[] = ["restaurant", "bakery", "grocery", "pharmacy", "cafe", "other"];
const PROMO_BG = [
  "linear-gradient(120deg, var(--brand-dark), var(--brand-light))",
  "linear-gradient(120deg, #b45309, #f59e0b)",
  "linear-gradient(120deg, #b91c1c, #f59e0b)",
];
const PROMO_ART = ["/art/balance_scale.webp", "/art/money_bag.webp", "/art/convenience_store.webp"];

type LocationProps = { t: Dictionary["location"]; locale: "ar" | "en"; current: Loc | null };

export function HomeFeed({
  stores,
  againIds,
  labels,
  langToggle,
  location,
  menu,
  searchLabels,
  discover,
}: {
  stores: StoreCard[];
  againIds: string[];
  labels: HomeLabels;
  langToggle: React.ReactNode;
  location: LocationProps;
  menu: Omit<React.ComponentProps<typeof SideMenuButton>, "className">;
  searchLabels: SearchLabels;
  // Extra rows placed under the category tiles (the Discover features).
  discover?: React.ReactNode;
}) {
  // No location yet: show the picker straight away so nearby stores can come first.
  const [picking, setPicking] = useState(!location.current);
  const { count } = useCart();
  const [cat, setCat] = useState<BusinessCategory | null>(null);
  const listRef = useRef<HTMLElement>(null);

  const openBy = useMemo(() => {
    const map = new Map<BusinessCategory, number>();
    for (const s of stores) if (s.isOpen) map.set(s.category, (map.get(s.category) ?? 0) + 1);
    return map;
  }, [stores]);
  const again = againIds.map((id) => stores.find((s) => s.id === id)).filter((s): s is StoreCard => !!s);
  const shown = stores.filter((s) => !cat || s.category === cat);

  function pick(c: BusinessCategory) {
    setCat((cur) => (cur === c ? null : c));
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <>
      {/* Top band: address, cart and search, like the big delivery apps. */}
      <section className="relative isolate overflow-hidden text-accent-ink lg:rounded-3xl" style={{ background: "linear-gradient(160deg, var(--accent-2), var(--accent) 50%, var(--accent-deep))" }}>
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <SideMenuButton {...menu} className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-accent-ink/15 transition hover:bg-accent-ink/25 active:scale-90 lg:hidden" />
              <LogoMark className="hidden h-9 w-9 shrink-0 sm:block md:hidden [&_rect]:fill-accent-ink [&_path]:stroke-accent [&_circle]:fill-accent" />
              <button type="button" onClick={() => setPicking((v) => !v)} aria-expanded={picking} className="min-w-0 text-start leading-tight">
                <span className="block text-xs font-semibold opacity-75">{labels.deliverTo}</span>
                <span className="flex items-center gap-1 truncate text-lg font-extrabold">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{labels.area}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                </span>
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-1 [&_button]:text-accent-ink [&_button:hover]:bg-accent-ink/10">
              <span className="md:hidden">{langToggle}</span>
              <Link href="/cart" title={labels.cart} className="relative flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-2xl bg-background text-foreground shadow-lg shadow-black/10 transition active:scale-90">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                <span className="text-[10px] font-bold leading-none">{labels.cart}</span>
                {count > 0 && (
                  <span key={count} className="pop absolute -bottom-0.5 -end-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-warm px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            </div>
          </div>
          {/* Tapping search opens the search screen in place, with the keyboard already up. */}
          <SearchLauncher labels={searchLabels} locale={location.locale} className="relative flex h-13 w-full items-center rounded-full bg-background ps-12 text-base text-muted shadow-xl shadow-black/10 transition active:scale-[0.99]" />
        </div>
        {/* Wavy edge into the dark page. */}
        <svg aria-hidden="true" viewBox="0 0 390 24" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-6 w-full text-background">
          <path fill="currentColor" d="M0 14 C 40 4, 70 22, 110 12 S 180 2, 220 12 S 300 24, 340 10 S 380 8, 390 12 V24 H0 Z" />
        </svg>
      </section>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-4">
        {picking && <LocationPicker {...location} startOpen onDone={() => setPicking(false)} />}
        {/* Category tiles */}
        <section className="grid grid-cols-3 gap-x-2.5 gap-y-4 pt-1 sm:grid-cols-6">
          {CATEGORIES.map((c, i) => {
            const n = openBy.get(c) ?? 0;
            const active = cat === c;
            return (
              <m.button
                key={c}
                whileTap={{ scale: 0.96 }}
                onClick={() => pick(c)}
                aria-pressed={active}
                className={`stagger relative flex flex-col items-center gap-1 rounded-2xl border-2 pb-2.5 pt-4 transition ${active ? "border-accent bg-accent/10" : "border-transparent bg-tile hover:border-accent/40"}`}
                style={{ "--i": i } as React.CSSProperties}
              >
                <span
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-0.5 text-[10px] font-bold ${n ? "bg-positive text-accent-ink" : "border border-line bg-background text-muted"}`}
                >
                  {n ? labels.openCount.replace("{n}", String(n)) : labels.soon}
                </span>
                <Art src={CATEGORY_ART[c]} className="h-16 w-16 drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]" />
                <span className="text-xs font-bold">{labels.tiles[c]}</span>
              </m.button>
            );
          })}
        </section>

        {discover}

        {again.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-extrabold">{labels.orderAgain}</h2>
            <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {again.map((s) => (
                <Link key={s.id} href={`/stores/${s.id}`} className="flex w-20 shrink-0 snap-start flex-col items-center gap-1.5 text-center transition active:scale-95">
                  <span className="relative">
                    <StoreBadge category={s.category} logo={s.logo} className="h-20 w-20 rounded-2xl border border-line" iconClass="h-11 w-11" />
                    {s.fee === 0 && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-warm px-1.5 text-[10px] font-bold text-white">{labels.freeDelivery}</span>}
                  </span>
                  <span className="line-clamp-2 text-xs font-semibold">{s.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section ref={listRef} id="stores" className="flex scroll-mt-4 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">{cat ? labels.tiles[cat] : labels.nearYou}</h2>
            {cat && (
              <button onClick={() => setCat(null)} className="chip h-8 text-xs">
                {labels.all} <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          {stores.length === 0 ? (
            <p className="card text-muted">{labels.none}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {shown.map((s, i) => (
                  <m.li key={s.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="stagger" style={{ "--i": i } as React.CSSProperties}>
                    <StoreRow s={s} labels={labels} />
                  </m.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
          {stores.length > 0 && shown.length === 0 && <p className="card text-center text-muted">{labels.noMatch}</p>}
        </section>


        {/* Swipeable banners for what makes M3akOrder different. */}
        <section className="-mx-4 flex snap-x scroll-px-4 snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {labels.promos.map((p, i) => (
            <Link
              key={p.title}
              href={p.href ?? "#stores"}
              className="relative flex h-32 w-[85%] shrink-0 snap-center flex-col justify-center overflow-hidden rounded-3xl p-5 pe-24 text-white shadow-lg shadow-black/10 transition active:scale-[0.98] sm:w-[calc(33.333%-0.5rem)]"
              style={{ background: PROMO_BG[i % PROMO_BG.length] }}
            >
              <span className="text-lg font-extrabold leading-tight">{p.title}</span>
              <span className="mt-1 text-sm leading-snug opacity-90">{p.body}</span>
              {(() => {
                return (
                  <span className="float-slow absolute end-4 top-1/2 -mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-white/20">
                    <Art src={PROMO_ART[i % PROMO_ART.length]} className="h-11 w-11" />
                  </span>
                );
              })()}
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}

function StoreRow({ s, labels }: { s: StoreCard; labels: HomeLabels }) {
  return (
    <Link
      href={`/stores/${s.id}`}
      className={`flex h-full items-stretch overflow-hidden rounded-3xl border border-line bg-surface lift hover:border-accent/50 active:scale-[0.99] ${s.isOpen ? "" : "opacity-60"}`}
    >
      <span className="relative grid w-20 shrink-0 place-items-center overflow-hidden border-e border-line bg-tile">
        {s.logo || s.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(s.logo ?? s.cover)!} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Art src={CATEGORY_ART[s.category]} className="h-14 w-14 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={`h-2 w-2 rounded-full ${s.isOpen ? "animate-pulse bg-positive" : "bg-muted"}`} />
          <span className={s.isOpen ? "text-positive" : "text-muted"}>{s.isOpen ? labels.open : labels.closed}</span>
          <span className="text-muted">· {s.categoryLabel}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-lg font-extrabold">{s.name}</span>
          {s.isDemo && <span className="shrink-0 rounded-md border border-warning/50 px-1.5 text-[11px] font-bold text-warning">{labels.demo}</span>}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <span>
            {s.prep}–{s.prep + 15} {labels.mins}
          </span>
          <span>·</span>
          <span className={s.fee === 0 ? "font-bold text-warm-deep" : ""}>{s.fee === 0 ? labels.freeDelivery : s.feeText}</span>
          {s.distanceText && (
            <>
              <span>·</span>
              <span className={`inline-flex items-center gap-0.5 ${s.inRange ? "text-foreground" : "text-warning"}`}>
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {s.distanceText}
              </span>
            </>
          )}
          {s.rating && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                {s.rating.avg.toFixed(1)}
              </span>
            </>
          )}
        </span>
      </span>
    </Link>
  );
}
