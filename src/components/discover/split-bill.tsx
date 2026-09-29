"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronDown, Minus, Plus, Send, Users } from "lucide-react";
import type { Extras } from "@/lib/i18n/extras";
import { fill, formatEGP } from "@/lib/format";

type Line = { id: string; name: string; qty: number; total: number };

// Split an order between friends: evenly, or by who ate which item (delivery and unassigned items shared).
export function SplitBill({ code, store, total, deliveryFee, lines, locale, x }: { code: string; store: string; total: number; deliveryFee: number; lines: Line[]; locale: string; x: Extras["split"] }) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState(2);
  const [mode, setMode] = useState<"even" | "items">("even");
  // Which person had each line; -1 means shared.
  const [owner, setOwner] = useState<Record<string, number>>({});

  const names = Array.from({ length: people }, (_, i) => fill(x.person, { n: i + 1 }));
  const shares = names.map(() => 0);
  if (mode === "even") shares.fill(total / people);
  else {
    let shared = deliveryFee;
    for (const l of lines) {
      const who = owner[l.id] ?? -1;
      if (who >= 0 && who < people) shares[who] += l.total;
      else shared += l.total;
    }
    // Any gap between item totals and the order total (discounts, rounding) is shared too.
    shared += total - deliveryFee - lines.reduce((n, l) => n + l.total, 0);
    for (let i = 0; i < people; i++) shares[i] += shared / people;
  }
  const money = (n: number) => formatEGP(Math.round(n * 100) / 100, locale);

  return (
    <section className="card flex flex-col gap-3">
      <button className="flex items-center justify-between gap-2 text-start" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="inline-flex items-center gap-2 font-bold">
          <Users className="h-5 w-5 text-accent" aria-hidden="true" /> {x.title}
        </span>
        <m.span animate={{ rotate: open ? 180 : 0 }} className="inline-flex">
          <ChevronDown className="h-5 w-5 text-muted" aria-hidden="true" />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{x.people}</span>
              <div className="flex items-center gap-2 rounded-xl border border-line p-1">
                <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface-2" onClick={() => setPeople((p) => Math.max(2, p - 1))} aria-label="-">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-6 text-center font-extrabold">{people}</span>
                <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface-2" onClick={() => setPeople((p) => Math.min(12, p + 1))} aria-label="+">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1 text-sm font-semibold">
              {(["even", "items"] as const).map((k) => (
                <button key={k} onClick={() => setMode(k)} className={`h-9 rounded-lg transition ${mode === k ? "bg-surface shadow-sm" : "text-muted"}`}>
                  {k === "even" ? x.evenly : x.byItem}
                </button>
              ))}
            </div>
            {mode === "items" && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted">{x.unassigned}</p>
                {lines.map((l) => (
                  <div key={l.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate">{l.qty}× {l.name}</span>
                      <span className="shrink-0 text-muted" dir="auto">{money(l.total)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {names.map((n, i) => (
                        <button key={n} onClick={() => setOwner((o) => ({ ...o, [l.id]: o[l.id] === i ? -1 : i }))} className={`chip h-7 px-2.5 text-xs ${owner[l.id] === i ? "border-accent bg-accent text-white" : ""}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {names.map((n, i) => (
                <m.li layout key={n} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2">
                  <span className="text-sm font-semibold">{n}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-extrabold text-warm" dir="auto">{money(shares[i])}</span>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(fill(x.message, { code, store, total: money(total), share: money(shares[i]) }))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#25d366] px-2.5 text-xs font-bold text-white"
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" /> {x.shareWhatsapp}
                    </a>
                  </span>
                </m.li>
              ))}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
