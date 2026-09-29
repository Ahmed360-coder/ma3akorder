"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Banknote, CreditCard, Minus, Plus, ShoppingBag, Store, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { fill, formatEGP } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { DeliveryAddress } from "@/lib/types";
import type { Loc } from "@/lib/location";
import { placeOrder } from "./actions";

export function Checkout({
  t,
  locale,
  signedIn,
  defaults,
  budgetLeft,
  loc,
}: {
  t: Dictionary;
  locale: string;
  signedIn: boolean;
  defaults: { address: DeliveryAddress | null; phone: string | null };
  budgetLeft: number | null;
  loc: Loc | null;
}) {
  const { cart, subtotal, setQty, clear } = useCart();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 py-10 text-center">
        <span className="float-slow grid h-20 w-20 place-items-center rounded-3xl bg-accent/10 text-accent">
          <ShoppingBag className="h-10 w-10" aria-hidden="true" />
        </span>
        <p className="text-muted">{t.cart.empty}</p>
        <Link href="/" className="btn-primary">
          {t.cart.browse}
        </Link>
      </div>
    );
  }

  const total = subtotal + cart.deliveryFee;
  const belowMin = subtotal < cart.minOrder;

  function submit(form: FormData) {
    setError(null);
    const change = String(form.get("change") ?? "").trim();
    start(async () => {
      const res = await placeOrder({
        businessId: cart!.businessId,
        items: cart!.lines.map((l) => ({ item_id: l.itemId, quantity: l.qty })),
        address: {
          area: String(form.get("area") ?? ""),
          street: String(form.get("street") ?? ""),
          floor_apt: String(form.get("floor_apt") ?? ""),
          landmark: String(form.get("landmark") ?? ""),
          // Only a real GPS fix helps the driver; an area's centre would mislead them.
          ...(loc?.precise ? { lat: loc.lat, lng: loc.lng } : {}),
        },
        phone: String(form.get("phone") ?? ""),
        cashChangeFor: change ? Number(change) : null,
        notes: String(form.get("notes") ?? ""),
      });
      if (res.error === "signin") return router.push("/login");
      if (res.error) return setError(res.error);
      clear();
      router.push(`/orders/${res.orderId}`);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-bold">
          <Store className="h-5 w-5 text-accent" aria-hidden="true" />
          {cart.businessName}
        </h2>
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {cart.lines.map((l) => (
              <m.li
                key={l.itemId}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, x: 40 }}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0 flex-1 truncate">{l.name}</span>
                <div className="flex items-center gap-0.5 rounded-xl border border-line bg-surface-2/60 p-0.5">
                  <button className="hit grid h-9 w-9 place-items-center rounded-lg hover:bg-surface active:scale-90" onClick={() => setQty(l.itemId, l.qty - 1)} aria-label={l.qty === 1 ? t.ui.removeItem : t.ui.removeOne} title={l.qty === 1 ? t.ui.removeItem : t.ui.removeOne}>
                    {l.qty === 1 ? <Trash2 className="h-4 w-4 text-danger" /> : <Minus className="h-4 w-4" />}
                  </button>
                  <span className="min-w-5 text-center font-bold">{l.qty}</span>
                  <button className="hit grid h-9 w-9 place-items-center rounded-lg hover:bg-surface active:scale-90" onClick={() => setQty(l.itemId, l.qty + 1)} aria-label={t.ui.addOne} title={t.ui.addOne}>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="w-20 text-end text-sm font-semibold">{formatEGP(l.price * l.qty, locale)}</span>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
        <dl className="flex flex-col gap-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{t.cart.subtotal}</dt><dd>{formatEGP(subtotal, locale)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{t.cart.deliveryFee}</dt><dd>{formatEGP(cart.deliveryFee, locale)}</dd></div>
          <div className="mt-1 flex justify-between border-t border-dashed border-line pt-2 text-lg font-extrabold"><dt>{t.cart.total}</dt><dd className="text-warm-deep">{formatEGP(total, locale)}</dd></div>
        </dl>
        {cart.deliveryFee > 0 && cart.deliveryFee / subtotal >= 0.25 && (
          <p className="rounded-xl bg-warning/10 p-3 text-sm text-warning">
            {fill(t.worth.feeShare, { n: Math.round((cart.deliveryFee / subtotal) * 100) })}
          </p>
        )}
        {budgetLeft !== null &&
          (total > budgetLeft ? (
            <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
              {fill(t.worth.overBudget, { amount: formatEGP(total - Math.max(budgetLeft, 0), locale) })}
            </p>
          ) : (
            <p className="text-sm text-muted">{fill(t.worth.budgetFit, { n: Math.round((total / budgetLeft) * 100) })}</p>
          ))}
        {belowMin && (
          <p className="text-sm text-warning">
            {t.cart.belowMin} {formatEGP(cart.minOrder, locale)}
          </p>
        )}
        <button className="w-fit text-sm text-muted underline-offset-4 hover:underline" onClick={clear}>{t.cart.clear}</button>
      </section>

      {!signedIn ? (
        <Link href="/login" className="btn-primary">{t.cart.signInFirst}</Link>
      ) : (
        <form action={submit} className="flex flex-col gap-3">
          <h2 className="font-bold">{t.cart.address}</h2>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t.cart.area}
            <input name="area" className="input" defaultValue={defaults.address?.area ?? (loc && !loc.precise ? loc.label : "") ?? ""} required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t.cart.street}
            <input name="street" className="input" defaultValue={defaults.address?.street ?? ""} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {t.cart.floorApt}
              <input name="floor_apt" className="input" defaultValue={defaults.address?.floor_apt ?? ""} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {t.cart.landmark}
              <input name="landmark" className="input" defaultValue={defaults.address?.landmark ?? ""} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t.cart.phone}
            <input name="phone" type="tel" dir="ltr" className="input" defaultValue={defaults.phone ?? ""} required />
          </label>
          <h2 className="mt-2 font-bold">{t.ui.payment}</h2>
          <div className="grid gap-2">
            <div className="flex items-center gap-3 rounded-2xl border border-accent bg-accent/10 p-3">
              <Banknote className="h-6 w-6 text-accent" aria-hidden="true" />
              <span className="flex-1 font-bold">{t.ui.cashOnDelivery}</span>
              <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-accent"><span className="h-2.5 w-2.5 rounded-full bg-accent" /></span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-line p-3 text-muted opacity-70" aria-disabled="true">
              <CreditCard className="h-6 w-6" aria-hidden="true" />
              <span className="flex-1 text-sm font-semibold">{t.ui.cardSoon}</span>
            </div>
          </div>
          <div className="card flex flex-col gap-2 p-4">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {t.cart.payWith} <span className="font-normal text-muted">{t.cart.payWithHint} ({t.common.optional})</span>
              <select name="change" className="input" defaultValue="">
                <option value="">—</option>
                {[50, 100, 200, 500, 1000].filter((n) => n >= total).map((n) => (
                  <option key={n} value={n}>{formatEGP(n, locale)}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t.cart.notes} <span className="font-normal text-muted">({t.common.optional})</span>
            <textarea name="notes" rows={2} className="input h-auto py-3" />
          </label>
          <button className="btn-primary" disabled={pending || belowMin}>
            {pending ? "…" : `${t.cart.checkout} · ${formatEGP(total, locale)}`}
          </button>
          {error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        </form>
      )}
    </div>
  );
}
