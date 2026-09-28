import { createClient } from "@/lib/supabase/server";

// Orders that count as money spent: everything except rejected or cancelled ones.
const COUNTED = ["placed", "accepted", "preparing", "ready", "picked_up", "delivered"];

export function monthStart(offset = 0) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}

export async function getMonthSpend(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("total")
    .eq("customer_id", userId)
    .in("status", COUNTED)
    .gte("created_at", monthStart().toISOString());
  return (data ?? []).reduce((n, o) => n + Number(o.total), 0);
}

export async function getSpendingOrders(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("total, delivery_fee, created_at, business_id, businesses(name_ar, name_en)")
    .eq("customer_id", userId)
    .in("status", COUNTED)
    .gte("created_at", monthStart(-5).toISOString())
    .order("created_at");
  return (data ?? []) as unknown as {
    total: number;
    delivery_fee: number;
    created_at: string;
    business_id: string;
    businesses: { name_ar: string; name_en: string | null } | null;
  }[];
}
