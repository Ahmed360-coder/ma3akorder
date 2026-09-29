"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, Mic, Search, ShoppingBag, Users } from "lucide-react";
import type { Dish, DiscoverStore } from "@/lib/discover";
import type { Extras } from "@/lib/i18n/extras";
import type { BusinessCategory } from "@/lib/types";
import { fill, formatEGP } from "@/lib/format";
import { DishArt } from "@/components/discover/dish-art";
import { useFillCart } from "@/components/discover/use-fill-cart";
import { matches, parseRequest } from "./parse";

type Labels = Extras["voice"] & { noOpen: string; viewCart: string; otherStore: string };

// Extra words a store's category stands for, so "coffee" finds cafés and "sweet" finds bakeries.
const CATEGORY_WORDS: Record<BusinessCategory, string> = {
  restaurant: "restaurant food مطعم اكل",
  bakery: "bakery bread sweet dessert cake فرن عيش حلو حلويات",
  grocery: "grocery supermarket بقاله سوبر ماركت",
  pharmacy: "pharmacy medicine صيدليه دوا",
  cafe: "cafe coffee drinks قهوه كافيه مشروبات",
  other: "",
};

// Minimal typing for the browser speech API (Chrome and Safari prefix it).
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

export function VoiceOrder({ stores, dishes, locale, x }: { stores: DiscoverStore[]; dishes: Dish[]; locale: string; x: Labels }) {
  const storeById = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores]);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  // Speech language, separate from the site language: many people type English but speak Arabic.
  const [speech, setSpeech] = useState<"ar-EG" | "en-US">(locale === "ar" ? "ar-EG" : "en-US");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const rec = useRef<Recognition | null>(null);
  const fillCart = useFillCart(x.otherStore);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    setSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
    return () => rec.current?.stop();
  }, []);

  function listen() {
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return setSupported(false);
    if (listening) return rec.current?.stop();
    const r = new Ctor();
    r.lang = speech;
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      const said = Array.from(e.results).map((res) => res[0].transcript).join(" ");
      setText(said);
      if (e.results[e.results.length - 1].isFinal) setQuery(said);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    if ("vibrate" in navigator) navigator.vibrate?.(20);
    r.start();
  }

  const parsed = useMemo(() => (query ? parseRequest(query) : null), [query]);
  const results = useMemo(() => {
    if (!parsed) return [];
    return dishes
      .filter((d) => {
        const s = storeById.get(d.storeId);
        if (parsed.maxPrice !== null && d.price > parsed.maxPrice) return false;
        if (!parsed.terms.length) return true;
        return matches(parsed, `${d.search} ${s?.name ?? ""} ${s ? CATEGORY_WORDS[s.category] : ""}`);
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 20);
  }, [parsed, dishes, storeById]);

  function add(d: Dish) {
    const s = storeById.get(d.storeId);
    if (s && fillCart.addOne(s, d)) setAdded((a) => [...a, d.itemId]);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="relative grid h-36 w-36 place-items-center">
          <AnimatePresence>
            {listening &&
              [0, 1, 2].map((i) => (
                <m.span
                  key={i}
                  className="absolute inset-0 rounded-full bg-accent/25"
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                />
              ))}
          </AnimatePresence>
          <m.button
            whileTap={{ scale: 0.9 }}
            onClick={listen}
            disabled={!supported}
            className={`relative grid h-28 w-28 place-items-center rounded-full text-white shadow-xl transition disabled:opacity-40 ${listening ? "bg-accent-deep shadow-accent/40" : "bg-accent shadow-accent/30"}`}
            aria-label={listening ? x.listening : x.tap}
          >
            <Mic className="h-12 w-12" aria-hidden="true" />
          </m.button>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1 text-sm font-semibold" role="group">
          {(["ar-EG", "en-US"] as const).map((l) => (
            <button key={l} onClick={() => setSpeech(l)} aria-pressed={speech === l} className={`h-9 rounded-lg px-4 transition ${speech === l ? "bg-surface shadow-sm" : "text-muted"}`}>
              {l === "ar-EG" ? "عربي" : "English"}
            </button>
          ))}
        </div>
        <p className="text-sm font-bold text-muted">{!supported ? x.noMic : listening ? x.listening : x.tap}</p>
        {/* Live sound bars while listening */}
        <div className="flex h-6 items-end gap-1" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <m.span key={i} className="w-1.5 rounded-full bg-accent" animate={listening ? { height: [6, 22, 8, 16, 6] } : { height: 4 }} transition={listening ? { duration: 0.9, repeat: Infinity, delay: i * 0.08 } : { duration: 0.2 }} />
          ))}
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(text);
        }}
      >
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={x.placeholder} dir="auto" />
        <button className="btn-primary h-12 w-12 shrink-0 px-0" aria-label={x.results}>
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>

      {!query && (
        <div className="flex flex-wrap gap-2">
          {x.examples.map((ex) => (
            <button key={ex} className="chip h-9" onClick={() => { setText(ex); setQuery(ex); }} dir="auto">
              “{ex}”
            </button>
          ))}
        </div>
      )}

      {!dishes.length && <p className="card text-center text-muted">{x.noOpen}</p>}

      {parsed && dishes.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="card flex flex-col gap-2 p-4">
            <span className="text-xs font-semibold text-muted">{x.heard}</span>
            <p className="text-lg font-bold" dir="auto">“{query}”</p>
            <div className="flex flex-wrap gap-1.5">
              {parsed.terms.map((g) => (
                <span key={g[0]} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent" dir="auto">{g[0]}</span>
              ))}
              {parsed.maxPrice !== null && <span className="rounded-full bg-warm/10 px-2.5 py-0.5 text-xs font-bold text-warm">{fill(x.under, { price: formatEGP(parsed.maxPrice, locale) })}</span>}
            </div>
            {parsed.people && (
              <Link href={`/feed?people=${parsed.people}${parsed.maxPrice ? `&budget=${parsed.maxPrice}` : ""}`} className="btn-ghost mt-1 h-10 text-sm">
                <Users className="h-4 w-4" aria-hidden="true" /> {fill(x.forPeople, { n: parsed.people })}
              </Link>
            )}
          </div>
          <h2 className="text-lg font-bold">{results.length ? x.results : x.none}</h2>
          {results.map((d, i) => {
            const s = storeById.get(d.storeId);
            const isAdded = added.includes(d.itemId);
            return (
              <m.div key={`${query}-${d.itemId}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card flex items-center gap-3 p-3">
                <DishArt photo={d.photo} category={s?.category ?? "restaurant"} className="h-14 w-14 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{d.name}</div>
                  <div className="truncate text-xs text-muted">{s?.name}</div>
                  <div className="text-sm font-extrabold text-warm" dir="auto">{formatEGP(d.price, locale)}</div>
                </div>
                <button className={isAdded ? "btn-ghost h-10 px-3 text-sm" : "btn-primary h-10 px-3 text-sm"} onClick={() => add(d)} disabled={isAdded}>
                  {isAdded ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                  {isAdded ? x.added : x.add}
                </button>
              </m.div>
            );
          })}
          {added.length > 0 && (
            <Link href="/cart" className="btn-primary">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {x.viewCart}
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
