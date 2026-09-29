"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Start a group basket for one store and open it.
export async function startGroupOrder(businessId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("create_group_order", { p_business_id: businessId });
  if (error || !data) return { error: "Could not start the group order. Try again." };
  redirect(`/group/${data as string}`);
}
