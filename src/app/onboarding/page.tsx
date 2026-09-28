import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage() {
  const { t } = await getDictionary();
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (profile?.onboarded) redirect("/account");

  const roles = ["customer", "business_owner", "driver"] as const;

  return (
    <>
      <Header t={t} />
      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
        <h1 className="mb-6 text-2xl font-bold">{t.onboarding.title}</h1>
        <form action={completeOnboarding} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            {t.onboarding.nameLabel}
            <input name="full_name" className="input" defaultValue={profile?.full_name ?? ""} autoComplete="name" required />
          </label>
          <fieldset className="flex flex-col gap-3">
            {roles.map((role, i) => (
              <label key={role} className="card flex cursor-pointer items-start gap-3 has-[:checked]:border-accent">
                <input type="radio" name="role" value={role} defaultChecked={i === 0} className="mt-1.5 accent-[var(--accent)]" />
                <span>
                  <span className="block font-bold">{t.onboarding[role].title}</span>
                  <span className="text-sm text-muted">{t.onboarding[role].body}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <button className="btn-primary">{t.onboarding.continue}</button>
        </form>
      </main>
    </>
  );
}
