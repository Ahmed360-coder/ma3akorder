"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";

const ROLES = ["customer", "business_owner", "driver"] as const;

export async function completeOnboarding(formData: FormData) {
  const role = String(formData.get("role"));
  if (!ROLES.includes(role as (typeof ROLES)[number])) throw new Error("Pick an account type");
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_role: role,
    p_full_name: String(formData.get("full_name") ?? ""),
    p_locale: await getLocale(),
  });
  if (error) throw new Error(error.message);
  redirect("/account");
}
