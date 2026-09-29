"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, History, Search, ShoppingBag, TrendingUp, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/components/cart-provider";
import { Art, StoreBadge } from "@/components/category-icon";
import { formatEGP } from "@/lib/format";
import type { StoreCard } from "@/lib/stores";
import type { BusinessCategory } from "@/lib/types";

export type SearchItem = { id: string; storeId: string; name: string; alt: string; price: number };
export type SearchData = { stores: StoreCard[]; items: SearchItem[]; popular: string[] };
type Tab = "all" | "food" | "groceries" | "pharmacies";
type Craving = "coffee" | "burgers" | "desserts" | "pizza" | "chicken" | "bread" | "fruit" | "medicine";

const TAB_CATS: Record<Tab, BusinessCategory[] | null> = {
  all: null,
  food: ["restaurant", "cafe", "bakery"],
  groceries: ["grocery", "other"],
  pharmacies: ["pharmacy"],
};
const CRAVINGS: { key: Craving; art: string; tint: string; tab: Tab }[] = [
  { key: "coffee", art: "/art/real/coffee.webp", tint: "#8a5a3c", tab: "food" },
  { key: "burgers", art: "/art/real/burger.webp", tint: "#e8590c", tab: "food" },
  { key: "desserts", art: "/art/real/cake.webp", tint: "#db2777", tab: "food" },
  { key: "pizza", art: "/art/real/pizza.webp", tint: "#dc2626", tab: "food" },
  { key: "chicken", art: "/art/real/chicken.webp", tint: "#c97a12", tab: "food" },
  { key: "bread", art: "/art/real/bread.webp", tint: "#b45309", tab: "food" },
  { key: "fruit", art: "/art/real/apple.webp", tint: "#12a150", tab: "groceries" },
  { key: "medicine", art: "/art/real/pills.webp", tint: "#2f6fdf", tab: "pharmacies" },
];
const RECENT_KEY = "m3akorder.recent-searches";

export type SearchLabels = {
  back: string;
  search: string;
  cart: string;
  craving: string;
  recent: string;
  popular: string;
  clear: string;
  nearYou: string;
  spotlight: string;
  storesTitle: string;
  itemsTitle: string;
  noMatch: string;
  mins: string;
  tabs: Record<Tab, string>;
  cravings: Record<Craving, string>;
  promo: { title: string; body: string };
};
type Labels = SearchLabels;

// One shared download per language, reused for a minute, so opening search never waits on the network.
let cached: { locale: string; at: number; data: Promise<SearchData> } | null = null;
export function loadSearchData(locale: string): Promise<SearchData> {
  if (cached && cached.locale === locale && Date.now() - cached.at < 60_000) return cached.data;
  const data = fetch("/search/data", { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<SearchData>;
  });
  data.catch(() => {
    if (cached?.data === data) cached = null;
  });
  cached = { locale, at: Date.now(), data };
  return data;
}

// Arabic-friendly matching: ignore case, tashkeel and the common alef/ya/ta-marbuta spelling variants.
function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

export function SearchScreen({
  initialQuery,
  labels,
  locale,
  onClose,
  inputRef,
  active = true,
}: {
  initialQuery: string;
  labels: Labels;
  locale: string;
  // Set when shown as an overlay on another page: Back closes it instead of going back a page.
  onClose?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  active?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<SearchData | null>(null);
  useEffect(() => {
    if (!active) return;
    let live = true;
    const get = () =>
      loadSearchData(locale).then(
        (d) => live && setData(d),
        () => live && setTimeout(get, 3000),
      );
    get();
    return () => {
      live = false;
    };
  }, [active, locale]);
  const stores = useMemo(() => data?.stores ?? [], [data]);
  const items = data?.items ?? [];
  const popular = data?.popular ?? [];
  const { count } = useCart();
  const [q, setQ] = useState(initialQuery);
  const [tab, setTab] = useState<Tab>("all");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
    } catch {}
  }, []);

  const lastLogged = useRef("");
  function remember(term: string) {
    const clean = term.trim();
    if (!clean) return;
    // Feeds "Popular searches". Only the words are saved, never who searched.
    if (clean.length >= 2 && clean !== lastLogged.current) {
      lastLogged.current = clean;
      createClient().rpc("log_search", { p_term: clean }).then(() => {}, () => {});
    }
    const next = [clean, ...recent.filter((r) => r !== clean)].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  }
  function clearRecent() {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {}
  }
  function runSearch(term: string, nextTab?: Tab) {
    setQ(term);
    if (nextTab) setTab(nextTab);
    remember(term);
  }

  const storeById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);
  const inTab = (c: BusinessCategory) => !TAB_CATS[tab] || TAB_CATS[tab]!.includes(c);
  const needle = norm(q.trim());
  const storeHits = stores.filter((s) => inTab(s.category) && (!needle || norm(`${s.name} ${s.area} ${s.categoryLabel}`).includes(needle)));
  const itemHits = needle
    ? items.filter((i) => {
        const s = storeById.get(i.storeId);
        return s && inTab(s.category) && norm(`${i.name} ${i.alt}`).includes(needle);
      })
    : [];
  const spotlight = stores.find((s) => s.isOpen && inTab(s.category)) ?? stores[0];

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar: back, search, cart. */}
      <div className="glass sticky top-0 z-20 border-b border-line/70">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 pt-3">
          <button onClick={() => (onClose ? onClose() : router.back())} title={labels.back} className="flex h-13 w-13 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-line bg-surface transition active:scale-90">
            <ArrowRight className="h-5 w-5 ltr:rotate-180" aria-hidden="true" />
            <span className="text-[10px] font-bold leading-none text-muted">{labels.back}</span>
          </button>
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              remember(q);
              (document.activeElement as HTMLElement | null)?.blur();
            }}
          >
            <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              ref={inputRef}
              autoFocus={!onClose}
              tabIndex={active ? 0 : -1}
              type="search"
              enterKeyHint="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => remember(q)}
              placeholder={labels.search}
              aria-label={labels.search}
              className="input h-13 rounded-full ps-11 pe-10 [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label={labels.clear} title={labels.clear} className="absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-2">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
          <Link href="/cart" title={labels.cart} className="relative flex h-13 w-13 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-line bg-surface transition active:scale-90">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] font-bold leading-none text-muted">{labels.cart}</span>
            {count > 0 && (
              <span key={count} className="pop absolute -bottom-0.5 -end-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-warm px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
        <nav className="mx-auto flex max-w-3xl overflow-x-auto px-2 [scrollbar-width:none]" role="tablist">
          {(Object.keys(labels.tabs) as Tab[]).map((key) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`relative flex-1 whitespace-nowrap px-4 py-3 text-sm font-bold transition-colors ${tab === key ? "text-foreground" : "text-muted"}`}>
              {labels.tabs[key]}
              {tab === key && <m.span layoutId="search-tab" className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-accent" />}
            </button>
          ))}
        </nav>
      </div>

      {active && (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-16 pt-5">
        <AnimatePresence mode="wait" initial={false}>
          {needle ? (
            <m.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-8">
              {!data && (
                <ul className="flex flex-col gap-2" aria-busy="true">
                  {[0, 1, 2].map((n) => (
                    <li key={n} className="skeleton h-17 rounded-2xl" />
                  ))}
                </ul>
              )}
              {data && storeHits.length === 0 && itemHits.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center text-muted">
                  <Art src="/art/magnifying_glass_tilted_left.webp" className="h-14 w-14 opacity-80" />
                  {labels.noMatch}
                </div>
              )}
              {itemHits.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-lg font-extrabold">{labels.itemsTitle}</h2>
                  <ul className="flex flex-col gap-2">
                    {itemHits.slice(0, 30).map((i, n) => {
                      const s = storeById.get(i.storeId)!;
                      return (
                        <li key={i.id} className="stagger" style={{ "--i": n } as React.CSSProperties}>
                          <Link href={`/stores/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-accent/50 active:scale-[0.99]">
                            <StoreBadge category={s.category} logo={s.logo} className="h-11 w-11 rounded-xl" iconClass="h-7 w-7" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-bold">{i.name}</span>
                              <span className="block truncate text-xs text-muted">{s.name}</span>
                            </span>
                            <span className="shrink-0 font-bold text-warm-deep">{formatEGP(i.price, locale)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
              {storeHits.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-lg font-extrabold">{labels.storesTitle}</h2>
                  <StoreTiles stores={storeHits} mins={labels.mins} />
                </section>
              )}
            </m.div>
          ) : (
            <m.div key="discover" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-8">
              <section className="flex flex-col gap-3">
                <h2 className="text-xl font-extrabold">{labels.craving}</h2>
                <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                  {CRAVINGS.filter((c) => tab === "all" || c.tab === tab).map((c, i) => (
                    <m.button
                      key={c.key}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => runSearch(labels.cravings[c.key], c.tab)}
                      className="stagger flex w-16 shrink-0 flex-col items-center gap-1.5"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-tile">
                        <Art src={c.art} className="h-12 w-12 drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" />
                      </span>
                      <span className="text-center text-[11px] font-semibold leading-tight text-muted">{labels.cravings[c.key]}</span>
                    </m.button>
                  ))}
                </div>
              </section>

              {recent.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold">{labels.recent}</h2>
                    <button onClick={clearRecent} className="text-sm font-semibold text-muted hover:text-foreground">
                      {labels.clear}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r} onClick={() => runSearch(r)} className="chip h-10 hover:text-foreground">
                        <History className="h-4 w-4" aria-hidden="true" />
                        {r}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {popular.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xl font-extrabold">{labels.popular}</h2>
                  <ol className="grid grid-cols-2 gap-x-4">
                    {popular.map((term, i) => (
                      <li key={term}>
                        <button onClick={() => runSearch(term)} className="flex w-full items-center gap-3 border-b border-line py-3 text-start transition active:scale-[0.98]">
                          <span className={`w-5 text-center text-sm font-extrabold ${i < 3 ? "text-accent" : "text-muted"}`}>{(i + 1).toLocaleString(locale === "ar" ? "ar-EG" : "en")}</span>
                          <span className="min-w-0 flex-1 truncate font-semibold">{term}</span>
                          {i < 3 && <TrendingUp className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />}
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {storeHits.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xl font-extrabold">{labels.nearYou}</h2>
                  <StoreTiles stores={storeHits} mins={labels.mins} />
                </section>
              )}

              {spotlight && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xl font-extrabold">{labels.spotlight}</h2>
                  <Link
                    href={`/stores/${spotlight.id}`}
                    className="relative isolate flex min-h-40 flex-col justify-end overflow-hidden rounded-3xl p-5 text-white shadow-xl shadow-black/10 transition active:scale-[0.99]"
                    style={{ background: "linear-gradient(135deg, var(--warm-2), var(--warm) 50%, var(--warm-deep))" }}
                  >
                    <span className="float-slow absolute end-5 top-5 -z-10 grid h-18 w-18 place-items-center rounded-3xl bg-white/20">
                      <Art src="/art/balance_scale.webp" className="h-12 w-12" />
                    </span>
                    <span className="w-fit rounded-lg bg-black/25 px-2 py-0.5 text-xs font-bold backdrop-blur">{spotlight.name}</span>
                    <span className="mt-2 text-2xl font-extrabold">{labels.promo.title}</span>
                    <span className="mt-1 max-w-xs text-sm opacity-90">{labels.promo.body}</span>
                  </Link>
                </section>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </main>
      )}
    </div>
  );
}

function StoreTiles({ stores, mins }: { stores: StoreCard[]; mins: string }) {
  return (
    <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {stores.map((s, i) => (
        <Link key={s.id} href={`/stores/${s.id}`} className={`stagger flex w-22 shrink-0 snap-start flex-col items-center gap-1.5 text-center transition active:scale-95 ${s.isOpen ? "" : "opacity-60"}`} style={{ "--i": i } as React.CSSProperties}>
          <StoreBadge category={s.category} logo={s.logo} className="h-22 w-22 rounded-2xl border border-line" iconClass="h-12 w-12" />
          <span className="line-clamp-1 text-sm font-bold">{s.name}</span>
          <span className="text-xs text-muted">
            {s.prep}–{s.prep + 15} {mins}
          </span>
        </Link>
      ))}
    </div>
  );
}
