import type { Metadata } from "next";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { createClient } from "@/lib/supabase/server";
import { pickName } from "@/lib/format";
import type { Item } from "@/lib/types";
import { PageTitle } from "@/components/discover/page-title";
import { GroupRoom, type GroupData } from "./group-room";

export const metadata: Metadata = { title: "Order together" };

export default async function GroupPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { locale } = await getDictionary();
  const x = getExtras(locale);
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_group_order", { p_code: code });
  const group = data as GroupData | null;

  let menu: { itemId: string; name: string; price: number; photo: string | null; stock: number | null }[] = [];
  if (group) {
    const { data: items } = await supabase.from("items").select("*").eq("business_id", group.business.id).eq("is_available", true).order("sort_order").order("created_at");
    menu = ((items ?? []) as Item[])
      .filter((i) => i.stock_count === null || i.stock_count > 0)
      .map((i) => ({ itemId: i.id, name: pickName(locale, i.name_ar, i.name_en), price: Number(i.price), photo: i.photo_url, stock: i.stock_count }));
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-28 pt-6">
        <PageTitle title={x.group.title} subtitle={group ? pickName(locale, group.business.name_ar, group.business.name_en) : x.group.subtitle} art="/art/real/pizza.webp" back={x.back} />
        {group ? <GroupRoom code={code.toUpperCase()} initial={group} menu={menu} locale={locale} x={{ ...x.group, otherStore: x.otherStoreInCart }} /> : <p className="card text-center text-muted">{x.group.notFound}</p>}
      </main>
    </>
  );
}
