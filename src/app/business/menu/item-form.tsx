"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Item } from "@/lib/types";
import { saveItem } from "../actions";

export function ItemForm({ t, item }: { t: Dictionary; item?: Item }) {
  const [state, action, pending] = useActionState(saveItem, null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && !item) form.current?.reset();
  }, [state, item]);

  return (
    <form ref={form} action={action} className="flex flex-col gap-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t.common.arabicName}
        <input name="name_ar" className="input" defaultValue={item?.name_ar} required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t.common.englishName}
        <input name="name_en" className="input" dir="ltr" defaultValue={item?.name_en ?? ""} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t.business.description}
        <input name="description" className="input" defaultValue={item?.description ?? ""} />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t.business.price}
          <input name="price" type="number" min="0" step="0.5" inputMode="decimal" className="input" defaultValue={item?.price} required />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t.business.unit}
          <input name="unit_amount" type="number" min="0.01" step="any" inputMode="decimal" className="input" defaultValue={item?.unit_amount ?? 1} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          &nbsp;
          <select name="unit_type" className="input px-2" defaultValue={item?.unit_type ?? "piece"}>
            {(["piece", "g", "ml"] as const).map((u) => (
              <option key={u} value={u}>
                {t.business.units[u]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t.business.stock}
        <input name="stock_count" type="number" min="0" step="1" inputMode="numeric" className="input" defaultValue={item?.stock_count ?? ""} placeholder={t.business.stockHint} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t.business.photo}
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm text-muted file:me-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-foreground" />
      </label>
      <button className="btn-primary" disabled={pending}>{pending ? "…" : item ? t.common.save : t.common.add}</button>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-positive">{t.common.saved}</p>}
    </form>
  );
}
