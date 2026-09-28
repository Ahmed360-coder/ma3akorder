import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Business } from "@/lib/types";

const CATEGORIES = ["restaurant", "bakery", "grocery", "pharmacy", "cafe", "other"] as const;

// Shared fields for creating a store and editing its settings.
export function StoreFields({ t, business }: { t: Dictionary; business?: Business | null }) {
  const b = business;
  return (
    <>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        {t.common.arabicName}
        <input name="name_ar" className="input" defaultValue={b?.name_ar ?? ""} required />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        {t.common.englishName} <span className="font-normal text-muted">({t.common.optional})</span>
        <input name="name_en" className="input" dir="ltr" defaultValue={b?.name_en ?? ""} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        {t.business.category}
        <select name="category" className="input" defaultValue={b?.category ?? "restaurant"}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t.categories[c]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2 text-sm font-semibold">
          {t.business.area}
          <input name="area" className="input" defaultValue={b?.area ?? ""} required />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          {t.business.phone}
          <input name="phone" type="tel" dir="ltr" className="input" defaultValue={b?.phone ?? ""} />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        {t.business.address}
        <input name="address" className="input" defaultValue={b?.address ?? ""} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold">
        {t.business.description} <span className="font-normal text-muted">({t.common.optional})</span>
        <textarea name="description" rows={2} className="input h-auto py-3" defaultValue={b?.description ?? ""} />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-2 text-sm font-semibold">
          {t.business.minOrder}
          <input name="min_order" type="number" min="0" step="1" inputMode="decimal" className="input" defaultValue={b?.min_order ?? 0} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          {t.business.deliveryFee}
          <input name="delivery_fee" type="number" min="0" step="1" inputMode="decimal" className="input" defaultValue={b?.delivery_fee ?? 15} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          {t.business.prepMinutes}
          <input name="prep_minutes" type="number" min="1" step="1" inputMode="numeric" className="input" defaultValue={b?.prep_minutes ?? 20} />
        </label>
      </div>
    </>
  );
}
