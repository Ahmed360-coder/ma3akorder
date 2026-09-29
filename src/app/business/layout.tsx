import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { getMyBusiness } from "@/lib/business";
import { createBusiness } from "./actions";
import { StoreFields } from "./store-form";
import { OpenSwitch } from "./open-switch";
import { BusinessTabs } from "./tabs";

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = await getDictionary();
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile?.onboarded) redirect("/onboarding");
  if (profile.role !== "business_owner" && profile.role !== "admin") redirect("/account");

  const business = await getMyBusiness();

  if (!business) {
    return (
      <>
        <Header />
        <main className="mx-auto w-full max-w-lg px-4 pb-16 pt-8">
          <h1 className="mb-1 text-2xl font-bold">{t.business.createTitle}</h1>
          <p className="mb-6 text-muted">{t.business.createNote}</p>
          <form action={createBusiness} className="flex flex-col gap-4">
            <StoreFields t={t} locale={locale} />
            <button className="btn-primary">{t.common.save}</button>
          </form>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pb-16 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{business.name_ar}</h1>
          <OpenSwitch open={business.is_open} label={t.business.isOpen} />
        </div>
        {business.status === "pending" && <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">{t.business.pending}</p>}
        {(business.status === "rejected" || business.status === "suspended") && (
          <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{t.business.rejected}</p>
        )}
        <BusinessTabs labels={t.business.tabs} />
        {children}
      </main>
    </>
  );
}

