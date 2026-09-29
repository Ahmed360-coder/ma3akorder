"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, m, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Check, Heart, RotateCcw, ShoppingBag, X } from "lucide-react";
import type { Dish, DiscoverStore } from "@/lib/discover";
import type { Extras } from "@/lib/i18n/extras";
import { fill, formatEGP } from "@/lib/format";
import { DishArt } from "@/components/discover/dish-art";
import { Confetti } from "@/components/discover/confetti";
import { useFillCart } from "@/components/discover/use-fill-cart";

type Labels = Extras["crave"] & { added: string; viewCart: string; otherStore: string };

const DECK = 10;
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

function Card({ dish, store, locale, x, onSwipe, top }: { dish: Dish; store?: DiscoverStore; locale: string; x: Labels; onSwipe: (like: boolean) => void; top: boolean }) {
  const dx = useMotionValue(0);
  const rotate = useTransform(dx, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(dx, [20, 110], [0, 1]);
  const nopeOpacity = useTransform(dx, [-110, -20], [1, 0]);

  function end(_: unknown, info: PanInfo) {
    if (info.offset.x > 110 || info.velocity.x > 600) onSwipe(true);
    else if (info.offset.x < -110 || info.velocity.x < -600) onSwipe(false);
  }

  return (
    <m.div
      className="absolute inset-0 touch-none select-none"
      style={{ x: dx, rotate, zIndex: top ? 2 : 1 }}
      drag={top ? "x" : false}
      dragSnapToOrigin
      onDragEnd={end}
      variants={{ out: (dir: number) => ({ x: dir * 520, opacity: 0, rotate: dir * 24, transition: { duration: 0.35 } }) }}
      initial={{ scale: 0.94, y: 14, opacity: 0 }}
      animate={{ scale: top ? 1 : 0.94, y: top ? 0 : 14, opacity: 1 }}
      exit="out"
    >
      <div className="card flex h-full cursor-grab flex-col items-center justify-center gap-4 overflow-hidden p-6 text-center active:cursor-grabbing">
        <m.span style={{ opacity: likeOpacity }} className="absolute start-5 top-5 -rotate-12 rounded-xl border-4 border-positive px-3 py-1 text-2xl font-black uppercase text-positive">
          {x.like}
        </m.span>
        <m.span style={{ opacity: nopeOpacity }} className="absolute end-5 top-5 rotate-12 rounded-xl border-4 border-danger px-3 py-1 text-2xl font-black uppercase text-danger">
          {x.nope}
        </m.span>
        <DishArt photo={dish.photo} category={store?.category ?? "restaurant"} className="h-44 w-44 rounded-[2rem]" />
        <div>
          <h2 className="text-2xl font-extrabold">{dish.name}</h2>
          <p className="text-sm text-muted">{store?.name}</p>
        </div>
        <span className="rounded-full bg-warm/10 px-4 py-1.5 text-lg font-extrabold text-warm" dir="auto">
          {formatEGP(dish.price, locale)}
        </span>
      </div>
    </m.div>
  );
}

export function CraveDeck({ stores, dishes, locale, x }: { stores: DiscoverStore[]; dishes: Dish[]; locale: string; x: Labels }) {
  const storeById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);
  const [round, setRound] = useState(0);
  // Shuffled after the page loads, so the server and browser first draw the same cards.
  const [deck, setDeck] = useState(() => dishes.slice(0, DECK));
  useEffect(() => setDeck(shuffle(dishes).slice(0, DECK)), [dishes, round]);
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<Dish[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  // Which way the last card left: 1 right (like), -1 left (nope).
  const [dir, setDir] = useState(1);
  const fillCart = useFillCart(x.otherStore);

  const done = index >= deck.length;
  const match = liked[0];

  function swipe(like: boolean) {
    const dish = deck[index];
    setDir(like ? 1 : -1);
    if (like && dish) setLiked((l) => [...l, dish]);
    if ("vibrate" in navigator) navigator.vibrate?.(like ? 25 : 10);
    setIndex((i) => i + 1);
  }

  function restart() {
    setRound((r) => r + 1);
    setIndex(0);
    setLiked([]);
    setAdded([]);
  }

  function addDish(d: Dish) {
    const s = storeById.get(d.storeId);
    if (s && fillCart.addOne(s, d)) setAdded((a) => [...a, d.itemId]);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        {match ? (
          <m.section initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="card flex flex-col items-center gap-3 text-center">
            <Confetti />
            <m.span animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: 2, duration: 0.5 }} className="inline-flex">
              <Heart className="h-10 w-10 fill-accent text-accent" aria-hidden="true" />
            </m.span>
            <h2 className="text-3xl font-black text-accent">{x.match}</h2>
            <p className="text-sm text-muted">{x.matchBody}</p>
            <DishArt photo={match.photo} category={storeById.get(match.storeId)?.category ?? "restaurant"} className="h-28 w-28 rounded-3xl" />
            <div>
              <div className="text-xl font-extrabold">{match.name}</div>
              <div className="text-sm text-muted">
                {storeById.get(match.storeId)?.name} · <span className="font-bold text-warm" dir="auto">{formatEGP(match.price, locale)}</span>
              </div>
            </div>
            {added.includes(match.itemId) ? (
              <Link href="/cart" className="btn-primary w-full">
                <Check className="h-5 w-5" aria-hidden="true" /> {x.viewCart}
              </Link>
            ) : (
              <button className="btn-primary w-full" onClick={() => addDish(match)}>
                <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {x.add}
              </button>
            )}
          </m.section>
        ) : (
          <p className="card text-center text-muted">{x.empty}</p>
        )}

        {liked.length > 1 && (
          <section className="flex flex-col gap-2">
            <h3 className="font-bold">{x.liked}</h3>
            {liked.slice(1).map((d, i) => (
              <m.div key={d.itemId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }} className="card flex items-center gap-3 p-3">
                <DishArt photo={d.photo} category={storeById.get(d.storeId)?.category ?? "restaurant"} className="h-12 w-12 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{d.name}</div>
                  <div className="truncate text-xs text-muted">{storeById.get(d.storeId)?.name}</div>
                </div>
                <span className="text-sm font-bold text-warm" dir="auto">{formatEGP(d.price, locale)}</span>
                <button className="btn-ghost h-10 px-3" onClick={() => addDish(d)} disabled={added.includes(d.itemId)} aria-label={x.add}>
                  {added.includes(d.itemId) ? <Check className="h-4 w-4 text-positive" /> : <ShoppingBag className="h-4 w-4" />}
                </button>
              </m.div>
            ))}
          </section>
        )}

        <button className="btn-ghost" onClick={restart}>
          <RotateCcw className="h-5 w-5" aria-hidden="true" /> {x.again}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-sm font-semibold text-muted">{fill(x.progress, { n: index + 1, total: deck.length })}</div>
      <div className="relative h-[26rem] w-full max-w-sm">
        <AnimatePresence custom={dir}>
          {deck.slice(index, index + 2).reverse().map((d) => (
            <Card key={`${round}-${d.itemId}`} dish={d} store={storeById.get(d.storeId)} locale={locale} x={x} top={d === deck[index]} onSwipe={swipe} />
          ))}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-6">
        <m.button whileTap={{ scale: 0.85 }} onClick={() => swipe(false)} className="grid h-16 w-16 place-items-center rounded-full border-2 border-danger/30 bg-surface text-danger shadow-lg" aria-label={x.nope}>
          <X className="h-8 w-8" aria-hidden="true" />
        </m.button>
        <m.button whileTap={{ scale: 0.85 }} onClick={() => swipe(true)} className="grid h-20 w-20 place-items-center rounded-full bg-accent text-white shadow-xl shadow-accent/30" aria-label={x.like}>
          <Heart className="h-9 w-9 fill-white" aria-hidden="true" />
        </m.button>
      </div>
      <div className="flex gap-10 text-xs font-bold text-muted">
        <span>{x.nope}</span>
        <span>{x.like}</span>
      </div>
    </div>
  );
}
