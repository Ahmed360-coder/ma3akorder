"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { t } = await getDictionary();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (error.message.includes("Store owners")) return { error: t.site.deleteHasStore };
    if (error.message.includes("in progress")) return { error: t.site.deleteActiveOrder };
    return { error: t.site.deleteFailed };
  }
  await supabase.auth.signOut();
  redirect("/");
}
