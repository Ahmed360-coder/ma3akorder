import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getExtras } from "@/lib/i18n/extras";
import { getCurrentProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { computeRewards, type RewardOrder } from "@/lib/rewards";
import { PageTitle } from "@/components/discover/page-title";
import { RewardsBoard } from "./rewards-board";

export const metadata: Metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const { locale } = await getDictionary();
  const x = getExtras(locale);
  const { user, profile } = await getCurrentProfile();

  let rewards = computeRewards([], 0, null);
  if (user) {
    const supabase = await createClient();
    const [{ data: orders }, { count }] = await Promise.all([
      supabase.from("orders").select("total, created_at, business_id").eq("customer_id", user.id).eq("status", "delivered"),
      supabase.from("ratings").select("id", { count: "exact", head: true }).eq("rater_id", user.id),
    ]);
    rewards = computeRewards((orders ?? []) as RewardOrder[], count ?? 0, profile?.monthly_budget ? Number(profile.monthly_budget) : null);
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-28 pt-6">
        <PageTitle title={x.rewards.title} subtitle={x.rewards.subtitle} art="/art/trophy.webp" back={x.back} />
        {!user && (
          <div className="card flex items-center justify-between gap-3">
            <p className="text-sm">{x.rewards.signIn}</p>
            <Link href="/login" className="btn-primary h-10 shrink-0 px-4">{x.rewards.signInBtn}</Link>
          </div>
        )}
        <RewardsBoard r={rewards} x={x.rewards} userKey={user?.id ?? "guest"} />
      </main>
    </>
  );
}
