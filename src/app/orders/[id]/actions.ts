"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Row Level Security only accepts a rating from the customer of a delivered order.
export async function rateOrder(_: unknown, form: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const orderId = String(form.get("order_id"));
  const target = form.get("target") === "driver" ? "driver" : "business";
  const stars = Math.round(Number(form.get("stars")));
  if (stars < 1 || stars > 5) return { ok: false, error: "Pick 1 to 5 stars" };
  const { data: order } = await supabase.from("orders").select("business_id, driver_id").eq("id", orderId).single();
  if (!order) return { ok: false, error: "Order not found" };
  const { error } = await supabase.from("ratings").insert({
    order_id: orderId,
    rater_id: user.id,
    target,
    business_id: target === "business" ? order.business_id : null,
    driver_id: target === "driver" ? order.driver_id : null,
    stars,
    comment: String(form.get("comment") ?? "").trim() || null,
  });
  revalidatePath(`/orders/${orderId}`);
  return { ok: !error, error: error?.message ?? null };
}
