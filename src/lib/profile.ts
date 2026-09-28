import { createClient } from "@/lib/supabase/server";

export type Role = "customer" | "business_owner" | "business_staff" | "driver" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";

export type Profile = {
  id: string;
  role: Role;
  approval_status: ApprovalStatus;
  onboarded: boolean;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  locale: "ar" | "en";
};

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  return { user, profile: data };
}
