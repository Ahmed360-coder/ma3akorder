"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, m, useAnimationControls } from "motion/react";
import { Check, Dices, ShoppingBag, Store } from "lucide-react";
import type { Dish, DiscoverStore } from "@/lib/discover";
import type { Extras } from "@/lib/i18n/extras";
import { formatEGP } from "@/lib/format";
import { DishArt } from "@/components/discover/dish-art";
import { Confetti } from "@/components/discover/confetti";
import { useFillCart } from "@/components/discover/use-fill-cart";

type Labels = Extras["spin"] & { noOpen: string; added: string; viewCart: string; otherStore: string };

const ROW = 88; // height of one reel row in px
const SPINS = 28; // rows that fly past before the winner

export function SpinMachine({ stores, dishes, locale, x }: { stores: DiscoverStore[]; dishes: Dish[]; locale: string; x: Labels }) {
  const storeById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);
  const prices = useMemo(() => {
    const top = Math.max(...dishes.map((d) => d.price));
    return [100, 200, 350, 500].filter((p) => p < top);
  }, [dishes]);
  const [max, setMax] = useState<number | null>(null);
  const [reel, setReel] = useState<Dish[]>(() => dishes.slice(0, 3));
  const [winner, setWinner] = useState<Dish | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [added, setAdded] = useState(false);
  const [burst, setBurst] = useState(0);
  const controls = useAnimationControls();
  const fill = useFillCart(x.otherStore);

  const pool = max ? dishes.filter((d) => d.price <= max) : dishes;

  async function spin() {
    if (!pool.length || spinning) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const blur = Array.from({ length: SPINS }, () => dishes[Math.floor(Math.random() * dishes.length)]);
    // The reel shows three rows; the winner lands in the middle one.
    const strip = [...blur, dishes[0], pick, dishes[Math.floor(Math.random() * dishes.length)]];
    setReel(strip);
    setWinner(null);
    setAdded(false);
    setSpinning(true);
    await controls.set({ y: 0 });
    await controls.start({ y: -(strip.length - 3) * ROW, transition: { duration: 2.6, ease: [0.12, 0.8, 0.18, 1] } });
    if ("vibrate" in navigator) navigator.vibrate?.(40);
    setWinner(pick);
    setSpinning(false);
    setBurst((b) => b + 1);
  }

  const store = winner ? storeById.get(winner.storeId) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted">{x.maxPrice}</span>
        {[null, ...prices].map((p) => (
          <button
            key={p ?? "any"}
            onClick={() => setMax(p)}
            className={`chip h-9 ${max === p ? "border-accent bg-accent text-white" : ""}`}
            aria-pressed={max === p}
          >
            {p ? formatEGP(p, locale) : x.any}
          </button>
        ))}
      </div>

      {/* The machine */}
      <div className="relative rounded-[2rem] p-3 shadow-xl shadow-warm/20" style={{ background: "linear-gradient(160deg, var(--warm-2, #ff9442), var(--warm) 55%, var(--warm-deep))" }}>
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-full bg-yellow-200 ${spinning ? "animate-pulse" : ""}`} style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-surface" style={{ height: ROW * 3 }}>
          <m.div animate={controls} initial={{ y: 0 }}>
            {reel.map((d, i) => {
              const s = storeById.get(d.storeId);
              return (
                <div key={i} className="flex items-center gap-3 px-4" style={{ height: ROW }}>
                  <DishArt photo={d.photo} name={d.name} category={s?.category ?? "restaurant"} className="h-14 w-14 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{d.name}</div>
                    <div className="truncate text-xs text-muted">{s?.name}</div>
                  </div>
                  <div className="font-extrabold text-warm" dir="auto">{formatEGP(d.price, locale)}</div>
                </div>
              );
            })}
          </m.div>
          {/* Fade the top and bottom rows, frame the middle one */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[88px] bg-gradient-to-b from-surface via-surface/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[88px] bg-gradient-to-t from-surface via-surface/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-2 top-[88px] h-[88px] rounded-2xl border-2 border-accent/70" />
        </div>
        <m.button
          whileTap={{ scale: 0.94 }}
          onClick={spin}
          disabled={spinning || !pool.length}
          className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-lg font-extrabold text-warm-deep shadow-md disabled:opacity-70"
        >
          <m.span animate={spinning ? { rotate: 360 } : { rotate: 0 }} transition={spinning ? { repeat: Infinity, duration: 0.6, ease: "linear" } : { duration: 0 }} className="inline-flex">
            <Dices className="h-6 w-6" aria-hidden="true" />
          </m.span>
          {spinning ? x.spinning : winner ? x.again : x.spin}
        </m.button>
      </div>

      {!pool.length && <p className="text-center text-sm text-muted">{x.none}</p>}

      <AnimatePresence mode="wait">
        {winner && store && (
          <m.section key={burst} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="card flex flex-col items-center gap-3 text-center">
            <Confetti />
            <span className="text-sm font-semibold text-muted">{x.winner}</span>
            <DishArt photo={winner.photo} name={winner.name} category={store.category} className="h-24 w-24 rounded-3xl" />
            <h2 className="text-2xl font-extrabold">{winner.name}</h2>
            <p className="text-sm text-muted">
              {x.from} <span className="font-bold text-foreground">{store.name}</span> · <span className="font-bold text-warm" dir="auto">{formatEGP(winner.price, locale)}</span>
            </p>
            <div className="flex w-full gap-2">
              {added ? (
                <Link href="/cart" className="btn-primary flex-1">
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {x.viewCart}
                </Link>
              ) : (
                <button className="btn-primary flex-1" onClick={() => setAdded(fill.addOne(store, winner))}>
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {x.add}
                </button>
              )}
              <Link href={`/stores/${store.id}`} className="btn-ghost flex-1">
                <Store className="h-5 w-5" aria-hidden="true" /> {x.open}
              </Link>
            </div>
            {added && (
              <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-1 text-sm font-semibold text-positive">
                <Check className="h-4 w-4" aria-hidden="true" /> {x.added}
              </m.p>
            )}
          </m.section>
        )}
      </AnimatePresence>
    </div>
  );
}
