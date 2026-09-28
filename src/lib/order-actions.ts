"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_order_status", { p_order_id: orderId, p_status: status });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

export async function claimDelivery(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_delivery", { p_order_id: orderId });
  if (error) return { error: error.message };
  revalidatePath("/driver");
  return { error: null };
}
