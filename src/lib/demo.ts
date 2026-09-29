import type { SupabaseClient } from "@supabase/supabase-js";

// Demo stores show only while no real store is live, and an admin can hide them earlier.
export async function getDemoState(supabase: SupabaseClient) {
  const [{ data: setting }, { count }] = await Promise.all([
    supabase.from("app_settings").select("value").eq("key", "hide_demo_stores").maybeSingle(),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "approved").eq("is_demo", false),
  ]);
  const hiddenByAdmin = setting?.value === true;
  const realStores = count ?? 0;
  return { hiddenByAdmin, realStores, showDemo: !hiddenByAdmin && realStores === 0 };
}
