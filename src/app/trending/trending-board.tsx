"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "motion/react";
import { Check, Flame, ShoppingBag } from "lucide-react";
import type { Dish, DiscoverStore } from "@/lib/discover";
import type { Extras } from "@/lib/i18n/extras";
import type { BusinessCategory } from "@/lib/types";
import { fill, formatEGP } from "@/lib/format";
import { DishArt } from "@/components/discover/dish-art";
import { useFillCart } from "@/components/discover/use-fill-cart";
import { EmptyState } from "@/components/empty-state";

export type TrendRow = { dish: Dish; orders: number; storeName: string; category: BusinessCategory };
type Labels = Extras["trending"] & { viewCart: string; otherStore: string };

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <div className="card flex flex-1 flex-col items-center gap-0.5 p-4 text-center">
      <m.span key={value} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-black text-accent">
        {value.toLocaleString()}
      </m.span>
      <span className="text-xs font-semibold text-muted">{label}</span>
    </div>
  );
}

export function TrendingBoard({ today, week, rows, fallback, openStores, locale, x }: { today: number; week: number; rows: TrendRow[]; fallback: TrendRow[]; openStores: DiscoverStore[]; locale: string; x: Labels }) {
  const router = useRouter();
  const [added, setAdded] = useState<string[]>([]);
  const fillCart = useFillCart(x.otherStore);
  const openById = new Map(openStores.map((s) => [s.id, s]));

  // Keep the board fresh while it's open.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);

  const list = rows.length ? rows : fallback;
  const top = Math.max(1, ...rows.map((r) => r.orders));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-xs font-bold text-positive">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-positive" />
        </span>
        {x.updated}
      </div>
      <div className="flex gap-3">
        <Counter value={today} label={x.today} />
        <Counter value={week} label={x.week} />
      </div>

      {!rows.length && (
        <>
          <EmptyState text={x.empty} art="/art/real/fries.webp" />
          {fallback.length > 0 && <h2 className="text-lg font-bold">{x.fallback}</h2>}
        </>
      )}

      <ol className="flex flex-col gap-3">
        {list.map((r, i) => {
          const store = openById.get(r.dish.storeId);
          const isAdded = added.includes(r.dish.itemId);
          return (
            <m.li key={r.dish.itemId} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="card relative flex items-center gap-3 overflow-hidden p-3">
              {rows.length > 0 && (
                // How hot the dish is compared with number one.
                <m.span className="absolute inset-y-0 start-0 -z-0 bg-accent/5" initial={{ width: 0 }} animate={{ width: `${(r.orders / top) * 100}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.05 }} />
              )}
              <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${i < 3 && rows.length ? "bg-accent text-white" : "bg-surface-2 text-muted"}`}>{i + 1}</span>
              <DishArt photo={r.dish.photo} name={r.dish.name} category={r.category} className="relative h-14 w-14 rounded-xl" />
              <div className="relative min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-bold">{r.dish.name}</span>
                  {i < 3 && rows.length > 0 && (
                    <m.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }} className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-warm/10 px-1.5 text-[10px] font-black text-warm">
                      <Flame className="h-3 w-3" aria-hidden="true" /> {x.hot}
                    </m.span>
                  )}
                </div>
                <div className="truncate text-xs text-muted">
                  {r.storeName}
                  {r.orders > 0 && ` · ${fill(x.ordered, { n: r.orders })}`}
                </div>
                <div className="text-sm font-extrabold text-warm" dir="auto">{formatEGP(r.dish.price, locale)}</div>
              </div>
              {store && (
                <button className={`relative ${isAdded ? "btn-ghost" : "btn-primary"} h-10 px-3 text-sm`} disabled={isAdded} onClick={() => fillCart.addOne(store, r.dish) && setAdded((a) => [...a, r.dish.itemId])}>
                  {isAdded ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                  {isAdded ? x.added : x.add}
                </button>
              )}
            </m.li>
          );
        })}
      </ol>
      {added.length > 0 && (
        <Link href="/cart" className="btn-primary">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {x.viewCart}
        </Link>
      )}
    </div>
  );
}
