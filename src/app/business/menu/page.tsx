import { getDictionary } from "@/lib/i18n/server";
import { getMyBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { formatEGP } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import type { Item } from "@/lib/types";
import { deleteItem, setItemAvailable } from "../actions";
import { ItemForm } from "./item-form";

export default async function MenuPage() {
  const { t, locale } = await getDictionary();
  const business = await getMyBusiness();
  const supabase = await createClient();
  const { data } = await supabase.from("items").select("*").eq("business_id", business!.id).order("sort_order").order("created_at");
  const items = (data ?? []) as Item[];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="flex flex-col gap-3">
        {items.length === 0 && <p className="card text-muted">{t.business.noItems}</p>}
        {items.map((item) => (
          <details key={item.id} className="card group p-0">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
              {item.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photo_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <span className="h-14 w-14 rounded-lg bg-surface-2" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{item.name_ar}</span>
                <span className="text-sm text-muted">
                  {formatEGP(item.price, locale)} · {item.unit_amount} {t.business.units[item.unit_type]}
                  {item.stock_count !== null && ` · ${item.stock_count} ${t.common.left}`}
                </span>
              </span>
              <ActionButton
                action={setItemAvailable.bind(null, item.id, !item.is_available)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${item.is_available ? "bg-positive/15 text-positive" : "bg-danger/15 text-danger"}`}
              >
                {item.is_available ? t.business.available : t.common.soldOut}
              </ActionButton>
            </summary>
            <div className="border-t border-line p-4">
              <ItemForm t={t} item={item} />
              <div className="mt-3">
                <ActionButton action={deleteItem.bind(null, item.id)} className="text-sm text-danger" confirmText={`${t.common.delete}?`}>
                  {t.common.delete}
                </ActionButton>
              </div>
            </div>
          </details>
        ))}
      </section>
      <aside className="card h-fit">
        <h2 className="mb-4 text-lg font-bold">{t.business.addItem}</h2>
        <ItemForm t={t} />
      </aside>
    </div>
  );
}
