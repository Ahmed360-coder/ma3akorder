"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Check, Copy, Minus, Plus, Send, ShoppingBag, UserRound } from "lucide-react";
import type { Extras } from "@/lib/i18n/extras";
import type { BusinessCategory } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/components/cart-provider";
import { fill, formatEGP, pickName } from "@/lib/format";
import { DishArt } from "@/components/discover/dish-art";
import { StoreBadge } from "@/components/category-icon";

export type GroupLine = { id: string; mine: boolean; member_name: string; item_id: string; name_ar: string; name_en: string | null; price: number; qty: number; stock_count: number | null; available: boolean };
export type GroupData = {
  code: string;
  status: "open" | "closed";
  is_host: boolean;
  host_name: string;
  business: { id: string; name_ar: string; name_en: string | null; category: BusinessCategory; logo_url: string | null; delivery_fee: number; min_order: number; is_open: boolean };
  lines: GroupLine[];
};
type MenuItem = { itemId: string; name: string; price: number; photo: string | null; stock: number | null };
type Labels = Extras["group"] & { otherStore: string };

const KEY = "m3akorder.member";
const COLORS = ["#cb202d", "#2f6fdf", "#0f9a4c", "#c77700", "#7c4dde", "#db2777", "#0891b2"];

function memberKey() {
  try {
    let k = localStorage.getItem(`${KEY}.key`);
    if (!k) {
      k = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(`${KEY}.key`, k);
    }
    return k;
  } catch {
    return crypto.randomUUID().replace(/-/g, "");
  }
}

export function GroupRoom({ code, initial, menu, locale, x }: { code: string; initial: GroupData; menu: MenuItem[]; locale: string; x: Labels }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { cart, load } = useCart();
  const [group, setGroup] = useState(initial);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [moved, setMoved] = useState(false);
  const [url, setUrl] = useState("");
  const channel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refresh = useCallback(async () => {
    const k = key || memberKey();
    const { data } = await supabase.rpc("get_group_order", { p_code: code, p_member_key: k });
    if (data) setGroup(data as GroupData);
  }, [supabase, code, key]);

  useEffect(() => {
    const k = memberKey();
    setKey(k);
    setUrl(`${window.location.origin}/group/${code}`);
    try {
      setName(localStorage.getItem(`${KEY}.name`) ?? "");
    } catch {}
  }, [code]);

  // Live: every change is broadcast to the others, with a slow poll as a safety net.
  useEffect(() => {
    if (!key) return;
    refresh();
    const ch = supabase.channel(`group-${code}`).on("broadcast", { event: "changed" }, () => refresh()).subscribe();
    channel.current = ch;
    const poll = setInterval(refresh, 10_000);
    return () => {
      clearInterval(poll);
      supabase.removeChannel(ch);
    };
  }, [key, code, supabase, refresh]);

  const announce = () => channel.current?.send({ type: "broadcast", event: "changed", payload: {} });

  async function run(id: string, fn: () => PromiseLike<{ error: unknown }>) {
    setBusy(id);
    setError(null);
    const { error: e } = await fn();
    setBusy(null);
    if (e) return setError(x.error);
    await refresh();
    announce();
  }

  const add = (item: MenuItem) => run(item.itemId, () => supabase.rpc("add_group_item", { p_code: code, p_member_key: key, p_member_name: name, p_item_id: item.itemId, p_qty: 1 }));
  const setQty = (line: GroupLine, qty: number) => run(line.id, () => supabase.rpc("set_group_item_qty", { p_code: code, p_line_id: line.id, p_member_key: key, p_qty: qty }));

  // People in the order they joined, each with their own colour and subtotal.
  const people = useMemo(() => {
    const map = new Map<string, { name: string; mine: boolean; lines: GroupLine[]; total: number }>();
    for (const l of group.lines) {
      const k = l.mine ? "__me" : l.member_name;
      const p = map.get(k) ?? { name: l.member_name, mine: l.mine, lines: [], total: 0 };
      p.lines.push(l);
      p.total += l.price * l.qty;
      map.set(k, p);
    }
    return [...map.values()];
  }, [group.lines]);
  const subtotal = people.reduce((n, p) => n + p.total, 0);
  const fee = Number(group.business.delivery_fee);
  const storeName = pickName(locale, group.business.name_ar, group.business.name_en);
  const open = group.status === "open";

  async function moveToCart() {
    if (cart && cart.lines.length && cart.businessId !== group.business.id && !window.confirm(x.otherStore)) return;
    const merged = new Map<string, { itemId: string; name: string; price: number; qty: number; stock: number | null }>();
    for (const l of group.lines) {
      if (!l.available) continue;
      const cur = merged.get(l.item_id);
      const max = l.stock_count ?? 50;
      if (cur) cur.qty = Math.min(cur.qty + l.qty, max);
      else merged.set(l.item_id, { itemId: l.item_id, name: pickName(locale, l.name_ar, l.name_en), price: Number(l.price), qty: Math.min(l.qty, max), stock: l.stock_count });
    }
    load({ businessId: group.business.id, businessName: storeName, deliveryFee: fee, minOrder: Number(group.business.min_order), lines: [...merged.values()] });
    await supabase.rpc("close_group_order", { p_code: code });
    announce();
    setMoved(true);
    router.push("/cart");
  }

  if (!open && !moved) return <p className="card text-center text-muted">{x.closed}</p>;

  return (
    <div className="flex flex-col gap-5">
      {/* Store and invite */}
      <section className="card flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <StoreBadge category={group.business.category} name={group.business.name_en ?? group.business.name_ar} logo={group.business.logo_url} className="h-12 w-12 rounded-xl" iconClass="h-8 w-8" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{storeName}</div>
            <div className="text-xs text-muted">{group.host_name ? fill(x.host, { name: group.host_name }) : ""}</div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-2.5 py-1 text-xs font-bold text-positive">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
            </span>
            {x.live}
          </span>
        </div>
        {!group.business.is_open && <p className="text-sm font-semibold text-danger">{x.closedStore}</p>}
        <div className="grid grid-cols-2 gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(fill(x.invite, { store: storeName, url }))}`} target="_blank" rel="noreferrer" className="btn h-11 bg-[#25d366] text-sm font-bold text-white">
            <Send className="h-4 w-4" aria-hidden="true" /> {x.share}
          </a>
          <button
            className="btn-ghost h-11 text-sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {}
            }}
          >
            {copied ? <Check className="h-4 w-4 text-positive" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? x.copied : x.copy}
          </button>
        </div>
      </section>

      {/* Join with a name */}
      {!name ? (
        <form
          className="card flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const n = draft.trim().slice(0, 30);
            if (!n) return;
            setName(n);
            try {
              localStorage.setItem(`${KEY}.name`, n);
            } catch {}
          }}
        >
          <label className="flex flex-col gap-2">
            <span className="font-semibold">{x.yourName}</span>
            <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={x.namePlaceholder} maxLength={30} autoFocus dir="auto" />
          </label>
          <button className="btn-primary">
            <UserRound className="h-5 w-5" aria-hidden="true" /> {x.join}
          </button>
        </form>
      ) : (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{x.menu}</h2>
          {menu.map((item) => (
            <div key={item.itemId} className="card flex items-center gap-3 p-3">
              <DishArt photo={item.photo} name={item.name} category={group.business.category} className="h-12 w-12 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{item.name}</div>
                <div className="text-sm font-bold text-warm" dir="auto">{formatEGP(item.price, locale)}</div>
              </div>
              <m.button whileTap={{ scale: 0.9 }} className="btn-primary h-10 px-3 text-sm" disabled={busy === item.itemId} onClick={() => add(item)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> {x.add}
              </m.button>
            </div>
          ))}
        </section>
      )}
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}

      {/* The live basket, by person */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{x.basket}</h2>
          <span className="text-sm text-muted">{fill(x.members, { n: people.length })}</span>
        </div>
        {!people.length && <p className="card text-center text-sm text-muted">{x.empty}</p>}
        <AnimatePresence initial={false}>
          {people.map((p, i) => (
            <m.div key={p.mine ? "__me" : p.name} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-black text-white" style={{ background: COLORS[i % COLORS.length] }}>
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex-1 font-bold">
                  {p.name} {p.mine && <span className="text-xs font-semibold text-muted">({x.you})</span>}
                </span>
                <span className="font-extrabold" dir="auto">{formatEGP(p.total, locale)}</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {p.lines.map((l) => (
                  <m.li layout key={l.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className={`min-w-0 truncate ${l.available ? "" : "text-muted line-through"}`}>{pickName(locale, l.name_ar, l.name_en)}</span>
                    {l.mine || group.is_host ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-lg border border-line p-0.5">
                        <button className="hit grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2" disabled={busy === l.id} onClick={() => setQty(l, l.qty - 1)} aria-label="-">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-5 text-center font-bold">{l.qty}</span>
                        <button className="hit grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2" disabled={busy === l.id} onClick={() => setQty(l, l.qty + 1)} aria-label="+">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ) : (
                      <span className="shrink-0 font-semibold text-muted">×{l.qty}</span>
                    )}
                  </m.li>
                ))}
              </ul>
            </m.div>
          ))}
        </AnimatePresence>
        {people.length > 0 && (
          <div className="card flex flex-col gap-1 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{x.total}</span>
              <span className="text-lg font-extrabold" dir="auto">{formatEGP(subtotal + fee, locale)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{x.each}</span>
              <span dir="auto">≈ {formatEGP(Math.round((subtotal + fee) / people.length), locale)}</span>
            </div>
          </div>
        )}
        {group.is_host && people.length > 0 && (
          <button className="btn-primary" onClick={moveToCart}>
            <ShoppingBag className="h-5 w-5" aria-hidden="true" /> {x.toCart}
          </button>
        )}
        {moved && (
          <Link href="/cart" className="btn-primary">
            {x.goCart}
          </Link>
        )}
      </section>
    </div>
  );
}
