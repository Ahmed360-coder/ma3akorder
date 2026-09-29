"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronDown, MapPin, Search, ShoppingBag, Star, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { LogoMark } from "@/components/logo";
import { CATEGORY_TINT } from "@/components/category-icon";
import type { BusinessCategory } from "@/lib/types";
import type { StoreCard } from "@/lib/stores";

export type HomeLabels = {
  brand: string;
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
// Emoji render as colourful 3D-style art on phones, with zero image downloads.
export const EMOJI: Record<BusinessCategory, string> = { restaurant: "🍔", bakery: "🥐", grocery: "🛒", pharmacy: "💊", cafe: "☕", other: "🛍️" };
const PROMO_BG = [
  "linear-gradient(120deg, #0a7a3c, #3cc878)",
  "linear-gradient(120deg, #6b3fd4, #b58cff)",
  "linear-gradient(120deg, #c2410c, #ffb35c)",
];
const PROMO_EMOJI = ["⚖️", "💰", "🏪"];

export function HomeFeed({ stores, againIds, labels, langToggle }: { stores: StoreCard[]; againIds: string[]; labels: HomeLabels; langToggle: React.ReactNode }) {
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
      <section className="relative isolate text-accent-ink" style={{ background: "linear-gradient(160deg, var(--accent-2), var(--accent) 50%, var(--accent-deep))" }}>
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <LogoMark className="h-9 w-9 shrink-0 md:hidden [&_rect]:fill-accent-ink [&_path]:stroke-accent [&_circle]:fill-accent" />
              <div className="min-w-0 leading-tight">
                <span className="block text-xs font-semibold opacity-75">{labels.deliverTo}</span>
                <span className="flex items-center gap-1 truncate text-lg font-extrabold">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{labels.area}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 [&_button]:text-accent-ink [&_button:hover]:bg-accent-ink/10">
              <span className="md:hidden">{langToggle}</span>
              <Link href="/cart" aria-label={labels.cart} className="relative grid h-12 w-12 place-items-center rounded-full bg-background text-foreground shadow-lg shadow-black/10 transition active:scale-90">
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && (
                  <span key={count} className="pop absolute -bottom-0.5 -end-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-accent px-1 text-[10px] font-bold text-accent-ink">
                    {count}
                  </span>
                )}
              </Link>
            </div>
          </div>
          {/* Tapping search opens the full search screen. */}
          <Link href="/search" className="relative flex h-13 w-full items-center rounded-full bg-background ps-12 text-base text-muted shadow-xl shadow-black/10 transition active:scale-[0.99]">
            <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2" aria-hidden="true" />
            {labels.search}
          </Link>
        </div>
        {/* Wavy edge into the dark page. */}
        <svg aria-hidden="true" viewBox="0 0 390 24" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-6 w-full text-background">
          <path fill="currentColor" d="M0 14 C 40 4, 70 22, 110 12 S 180 2, 220 12 S 300 24, 340 10 S 380 8, 390 12 V24 H0 Z" />
        </svg>
      </section>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-4">
        {/* Category tiles */}
        <section className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map((c, i) => {
            const n = openBy.get(c) ?? 0;
            const active = cat === c;
            return (
              <m.button
                key={c}
                whileTap={{ scale: 0.94 }}
                onClick={() => pick(c)}
                aria-pressed={active}
                className={`stagger relative flex flex-col items-center gap-1 rounded-3xl border pb-3 pt-5 transition ${active ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-accent/40"}`}
                style={{ "--i": i, backgroundImage: active ? undefined : `radial-gradient(90% 70% at 50% 30%, ${CATEGORY_TINT[c]}26, transparent 70%)` } as React.CSSProperties}
              >
                <span
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-0.5 text-[10px] font-bold ${n ? "bg-positive text-accent-ink" : "border border-line bg-background text-muted"}`}
                >
                  {n ? labels.openCount.replace("{n}", String(n)) : labels.soon}
                </span>
                <span className="text-[2.6rem] leading-none drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-110">{EMOJI[c]}</span>
                <span className="text-sm font-bold">{labels.tiles[c]}</span>
              </m.button>
            );
          })}
        </section>

        {again.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-extrabold">{labels.orderAgain}</h2>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {again.map((s) => (
                <Link key={s.id} href={`/stores/${s.id}`} className="flex w-24 shrink-0 snap-start flex-col items-center gap-1.5 text-center transition active:scale-95">
                  <span
                    className="relative grid h-24 w-24 place-items-center rounded-3xl border border-white/10 text-4xl shadow-lg shadow-black/10"
                    style={{ background: `linear-gradient(145deg, ${CATEGORY_TINT[s.category]}, ${CATEGORY_TINT[s.category]}88)` }}
                  >
                    {EMOJI[s.category]}
                    {s.fee === 0 && <span className="absolute -bottom-2 rounded-md bg-positive px-1.5 text-[10px] font-bold text-accent-ink">{labels.freeDelivery}</span>}
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
        <section className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {labels.promos.map((p, i) => (
            <Link
              key={p.title}
              href={p.href ?? "#stores"}
              className="relative flex h-32 w-[85%] shrink-0 snap-center flex-col justify-center overflow-hidden rounded-3xl p-5 pe-24 text-white shadow-lg shadow-black/10 transition active:scale-[0.98] sm:w-[calc(33.333%-0.5rem)]"
              style={{ background: PROMO_BG[i % PROMO_BG.length] }}
            >
              <span className="text-lg font-extrabold leading-tight">{p.title}</span>
              <span className="mt-1 text-sm leading-snug opacity-90">{p.body}</span>
              <span className="float-slow absolute end-4 top-1/2 -mt-8 text-6xl drop-shadow-[0_10px_12px_rgba(0,0,0,0.18)]">{PROMO_EMOJI[i]}</span>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}

function StoreRow({ s, labels }: { s: StoreCard; labels: HomeLabels }) {
  const tint = CATEGORY_TINT[s.category];
  return (
    <Link
      href={`/stores/${s.id}`}
      className={`flex h-full items-stretch overflow-hidden rounded-3xl border border-line bg-surface transition hover:border-accent/50 active:scale-[0.99] ${s.isOpen ? "" : "opacity-60"}`}
    >
      <span className="relative grid w-28 shrink-0 place-items-center text-5xl" style={{ background: `linear-gradient(145deg, ${tint}, ${tint}77)` }}>
        <span className="drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]">{EMOJI[s.category]}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={`h-2 w-2 rounded-full ${s.isOpen ? "animate-pulse bg-positive" : "bg-muted"}`} />
          <span className={s.isOpen ? "text-positive" : "text-muted"}>{s.isOpen ? labels.open : labels.closed}</span>
          <span className="text-muted">· {s.categoryLabel}</span>
        </span>
        <span className="truncate text-lg font-extrabold">{s.name}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <span>
            {s.prep}–{s.prep + 15} {labels.mins}
          </span>
          <span>·</span>
          <span className={s.fee === 0 ? "font-semibold text-positive" : ""}>{s.fee === 0 ? labels.freeDelivery : s.feeText}</span>
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
