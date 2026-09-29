"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, Minus, Plus, ShoppingBag, Sparkles, Star } from "lucide-react";
import type { Dish, DiscoverStore } from "@/lib/discover";
import type { Extras } from "@/lib/i18n/extras";
import { formatEGP } from "@/lib/format";
import { StoreBadge } from "@/components/category-icon";
import { useFillCart } from "@/components/discover/use-fill-cart";
import { planMeal, type Meal } from "./plan";

type Labels = Extras["feed"] & { added: string; viewCart: string; otherStore: string; mins: string };

const QUICK = [150, 300, 500, 800, 1200];

export function MealBuilder({ stores, dishes, locale, x }: { stores: DiscoverStore[]; dishes: Dish[]; locale: string; x: Labels }) {
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState(300);
  const [shown, setShown] = useState<{ people: number; budget: number } | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const fill = useFillCart(x.otherStore);

  const meals = useMemo(() => {
    if (!shown) return [];
    return stores
      .map((s) => planMeal(s, dishes.filter((d) => d.storeId === s.id), shown.people, shown.budget))
      .filter((m): m is Meal => !!m)
      .sort((a, b) => a.left - b.left || (b.store.rating?.avg ?? 0) - (a.store.rating?.avg ?? 0));
  }, [shown, stores, dishes]);

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">{x.people}</span>
          <div className="flex items-center gap-2 rounded-xl border border-line p-1">
            <button className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2 active:scale-90" onClick={() => setPeople((p) => Math.max(1, p - 1))} aria-label={`${x.people} -`}>
              <Minus className="h-4 w-4" />
            </button>
            <AnimatePresence mode="popLayout" initial={false}>
              <m.span key={people} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="min-w-8 text-center text-lg font-extrabold">
                {people}
              </m.span>
            </AnimatePresence>
            <button className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2 active:scale-90" onClick={() => setPeople((p) => Math.min(20, p + 1))} aria-label={`${x.people} +`}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between font-semibold">
            {x.budget}
            <span className="text-lg font-extrabold text-warm" dir="auto">{formatEGP(budget, locale)}</span>
          </span>
          <input type="range" min={50} max={3000} step={25} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="accent-[var(--warm)]" />
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button key={q} className={`chip h-8 ${budget === q ? "border-warm bg-warm text-white" : ""}`} onClick={() => setBudget(q)}>
              {formatEGP(q, locale)}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">
          ≈ <span className="font-bold text-foreground" dir="auto">{formatEGP(Math.floor(budget / people), locale)}</span> {x.perPerson}
        </p>
        <m.button whileTap={{ scale: 0.97 }} className="btn-primary" onClick={() => { setShown({ people, budget }); setAddedId(null); }}>
          <Sparkles className="h-5 w-5" aria-hidden="true" /> {x.build}
        </m.button>
      </section>

      {shown && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{x.results}</h2>
          {!meals.length && <p className="card text-center text-muted">{x.none}</p>}
          {meals.map((meal, i) => (
            <m.article
              key={`${meal.store.id}-${shown.people}-${shown.budget}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <StoreBadge category={meal.store.category} logo={meal.store.logo} className="h-12 w-12 rounded-xl" iconClass="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <Link href={`/stores/${meal.store.id}`} className="block truncate font-bold hover:underline">{meal.store.name}</Link>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {meal.store.rating && (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" /> {meal.store.rating.avg.toFixed(1)}
                      </span>
                    )}
                    <span>{meal.store.prep} {x.mins}</span>
                    {meal.store.distanceText && <span>{meal.store.distanceText}</span>}
                  </div>
                </div>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm">
                {meal.lines.map((l) => (
                  <li key={l.dish.itemId} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      <span className="font-bold text-accent">{l.qty}×</span> {l.dish.name}
                    </span>
                    <span className="shrink-0 text-muted" dir="auto">{formatEGP(l.qty * l.dish.price, locale)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-2 text-muted">
                  <span>{x.delivery}</span>
                  <span dir="auto">{formatEGP(meal.store.fee, locale)}</span>
                </li>
              </ul>
              {/* How much of the budget this meal uses */}
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <m.div className="h-full rounded-full bg-gradient-to-r from-accent to-warm" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (meal.total / shown.budget) * 100)}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.07 }} />
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="text-xs text-muted">{x.total}</div>
                  <div className="text-xl font-extrabold" dir="auto">{formatEGP(meal.total, locale)}</div>
                </div>
                <div className="text-sm font-semibold text-positive" dir="auto">{formatEGP(meal.left, locale)} {x.left}</div>
              </div>
              {addedId === meal.store.id ? (
                <Link href="/cart" className="btn-primary">
                  <Check className="h-5 w-5" aria-hidden="true" /> {x.viewCart}
                </Link>
              ) : (
                <button className="btn-primary" onClick={() => fill.loadMany(meal.store, meal.lines) && setAddedId(meal.store.id)}>
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {x.fill}
                </button>
              )}
            </m.article>
          ))}
        </section>
      )}
    </div>
  );
}
