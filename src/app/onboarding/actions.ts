"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { sendSignupAlert } from "@/lib/signup-email";

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

  // Tell the owner about the new account once the page has been sent.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const fullName = String(formData.get("full_name") ?? "").trim();
    after(() =>
      sendSignupAlert({
        name: fullName || null,
        email: user.email || null,
        phone: user.phone || null,
        role,
        method: String(user.app_metadata?.provider ?? (user.phone ? "phone" : "email")),
        at: new Date(),
      }),
    );
  }
  redirect(role === "business_owner" ? "/business" : role === "driver" ? "/driver" : "/");
}
