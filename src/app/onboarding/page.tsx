import { redirect } from "next/navigation";
import { Bike, ShoppingBag, Store } from "lucide-react";
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
  const icons = { customer: ShoppingBag, business_owner: Store, driver: Bike };

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
        <h1 className="mb-6 text-2xl font-bold">{t.onboarding.title}</h1>
        <form action={completeOnboarding} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            {t.onboarding.nameLabel}
            <input name="full_name" className="input" defaultValue={profile?.full_name ?? ""} autoComplete="name" required />
          </label>
          <fieldset className="flex flex-col gap-3">
            {roles.map((role, i) => {
              const Icon = icons[role];
              return (
              <label key={role} className="card stagger flex cursor-pointer items-center gap-3 transition has-[:checked]:border-accent has-[:checked]:bg-accent/5" style={{ "--i": i } as React.CSSProperties}>
                <input type="radio" name="role" value={role} defaultChecked={i === 0} className="peer sr-only" />
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted transition peer-checked:bg-accent peer-checked:text-accent-ink">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-bold">{t.onboarding[role].title}</span>
                  <span className="text-sm text-muted">{t.onboarding[role].body}</span>
                </span>
              </label>
              );
            })}
          </fieldset>
          <button className="btn-primary">{t.onboarding.continue}</button>
        </form>
      </main>
    </>
  );
}
