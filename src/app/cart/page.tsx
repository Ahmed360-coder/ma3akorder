import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { DeliveryAddress } from "@/lib/types";
import { getMonthSpend } from "@/lib/spending";
import { Checkout } from "./checkout";
import { getCustomerLocation } from "@/lib/location-server";

export default async function CartPage() {
  const { t, locale } = await getDictionary();
  const { user, profile } = await getCurrentProfile();
  let lastAddress: DeliveryAddress | null = null;
  let lastPhone: string | null = profile?.phone ?? null;
  let budgetLeft: number | null = null;
  if (user && profile?.monthly_budget) {
    budgetLeft = Number(profile.monthly_budget) - (await getMonthSpend(user.id));
  }
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select("delivery_address, customer_phone")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastAddress = (data?.delivery_address as DeliveryAddress) ?? null;
    lastPhone = lastPhone ?? data?.customer_phone ?? null;
  }
  const loc = await getCustomerLocation();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-lg px-4 pb-16 pt-6">
        <h1 className="mb-5 text-2xl font-bold">{t.cart.title}</h1>
        <Checkout t={t} locale={locale} signedIn={!!user} defaults={{ address: lastAddress, phone: lastPhone }} budgetLeft={budgetLeft} loc={loc} />
      </main>
    </>
  );
}
