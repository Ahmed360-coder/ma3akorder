"use client";

import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { Star } from "lucide-react";
import type { StoreCard } from "@/lib/stores";
import type { Extras } from "@/lib/i18n/extras";
import { StoreBadge } from "@/components/category-icon";
import { useFavorites } from "@/components/discover/favorites";
import { HeartButton } from "@/components/discover/heart-button";
import { Art } from "@/components/category-icon";

export function FavoritesList({ stores, x }: { stores: StoreCard[]; x: Extras["favorites"] & { open: string; closed: string; mins: string } }) {
  const { ids, ready } = useFavorites();
  if (!ready) return <div className="skeleton h-24" />;
  const byId = new Map(stores.map((s) => [s.id, s]));
  const saved = ids.map((id) => byId.get(id)).filter((s): s is StoreCard => !!s);

  if (!saved.length)
    return (
      <div className="card flex flex-col items-center gap-3 text-center">
        <Art src="/art/red_heart.webp" className="float-slow h-16 w-16 opacity-80" />
        <p className="text-muted">{x.empty}</p>
        <Link href="/" className="btn-primary">{x.browse}</Link>
      </div>
    );

  return (
    <ul className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {saved.map((s) => (
          <m.li key={s.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }} className="card flex items-center gap-3 p-3">
            <Link href={`/stores/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <StoreBadge category={s.category} logo={s.logo} className="h-14 w-14 rounded-xl" iconClass="h-9 w-9" />
              <div className="min-w-0">
                <div className="truncate font-bold">{s.name}</div>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span className={s.isOpen ? "font-semibold text-positive" : ""}>{s.isOpen ? x.open : x.closed}</span>
                  {s.rating && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" /> {s.rating.avg.toFixed(1)}
                    </span>
                  )}
                  <span>{s.prep} {x.mins}</span>
                  {s.distanceText && <span>{s.distanceText}</span>}
                </div>
              </div>
            </Link>
            <HeartButton storeId={s.id} labels={x} />
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
