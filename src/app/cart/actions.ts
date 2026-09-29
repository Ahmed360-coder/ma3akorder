"use server";

import { createClient } from "@/lib/supabase/server";
import type { DeliveryAddress } from "@/lib/types";

export type PlaceOrderInput = {
  businessId: string;
  items: { item_id: string; quantity: number }[];
  address: DeliveryAddress;
  phone: string;
  cashChangeFor: number | null;
  notes: string;
};

export async function placeOrder(input: PlaceOrderInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signin", orderId: null };
  const { data, error } = await supabase.rpc("place_order", {
    p_business_id: input.businessId,
    p_items: input.items,
    p_address: input.address,
    p_phone: input.phone,
    p_cash_change_for: input.cashChangeFor,
    p_notes: input.notes,
  });
  if (error) return { error: error.message, orderId: null };
  // Remember the phone for next time.
  await supabase.from("profiles").update({ phone: input.phone }).eq("id", user.id).is("phone", null);
  return { error: null, orderId: (data as { id: string }).id };
}
