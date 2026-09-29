"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Status = "approved" | "rejected" | "suspended";

// Row Level Security only lets admins make these changes.
export async function setBusinessStatus(id: string, status: Status) {
  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update({ status }).eq("id", id);
  revalidatePath("/admin");
  return { error: error?.message ?? null };
}

export async function setProfileStatus(id: string, status: Status) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ approval_status: status }).eq("id", id);
  revalidatePath("/admin");
  return { error: error?.message ?? null };
}

export async function setHideDemoStores(hide: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").update({ value: hide, updated_at: new Date().toISOString() }).eq("key", "hide_demo_stores");
  revalidatePath("/", "layout");
  return { error: error?.message ?? null };
}
