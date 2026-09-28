"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setBudget(form: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const raw = String(form.get("budget") ?? "").trim();
  const value = raw === "" || form.get("remove") ? null : Math.max(0, Math.round(Number(raw)));
  await supabase.from("profiles").update({ monthly_budget: Number.isFinite(value) ? value : null }).eq("id", user.id);
  revalidatePath("/spending");
  revalidatePath("/cart");
}
