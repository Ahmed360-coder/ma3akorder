import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types";

export async function getMyBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle<Business>();
  return data;
}
