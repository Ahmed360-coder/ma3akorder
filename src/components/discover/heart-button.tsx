"use client";

import { AnimatePresence, m } from "motion/react";
import { Heart } from "lucide-react";
import { useFavorites } from "./favorites";

const BURST = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

// Save or unsave a store, with a little heart burst.
export function HeartButton({ storeId, labels, className = "" }: { storeId: string; labels: { save: string; saved: string }; className?: string }) {
  const { has, toggle } = useFavorites();
  const on = has(storeId);
  return (
    <m.button
      whileTap={{ scale: 0.85 }}
      onClick={() => toggle(storeId)}
      aria-pressed={on}
      className={`relative inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition ${on ? "border-rose-200 bg-rose-50 text-rose-600" : "border-line bg-surface text-muted hover:text-foreground"} ${className}`}
    >
      <span className="relative inline-flex">
        <m.span key={String(on)} initial={{ scale: on ? 0.3 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 12 }} className="inline-flex">
          <Heart className={`h-5 w-5 ${on ? "fill-rose-500 text-rose-500" : ""}`} aria-hidden="true" />
        </m.span>
        <AnimatePresence>
          {on &&
            BURST.map((a, i) => (
              <m.span
                key={`${i}`}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-rose-400"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: Math.cos(a) * 18, y: Math.sin(a) * 18, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            ))}
        </AnimatePresence>
      </span>
      {on ? labels.saved : labels.save}
    </m.button>
  );
}
