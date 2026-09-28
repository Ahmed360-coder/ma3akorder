import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/lib/profile";
import { signOut } from "./actions";

export default async function AccountPage() {
  const { t } = await getDictionary();
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile?.onboarded) redirect("/onboarding");

  const pending = profile.approval_status !== "approved";

  return (
    <>
      <Header t={t} />
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pb-16 pt-8">
        <h1 className="text-2xl font-bold">{profile.full_name ?? t.account.title}</h1>
        <dl className="card grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted">{t.account.role}</dt>
            <dd className="font-bold">{t.account.roles[profile.role]}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t.account.status}</dt>
            <dd className={`font-bold ${pending ? "text-warning" : "text-positive"}`}>{t.account.statuses[profile.approval_status]}</dd>
          </div>
          <div className="col-span-2 text-sm text-muted" dir="ltr">
            {profile.email ?? profile.phone}
          </div>
        </dl>
        <p className="text-muted">{pending ? t.account.pendingNote : t.account.nextUp}</p>
        <form action={signOut}>
          <button className="btn-ghost w-full">{t.account.signOut}</button>
        </form>
      </main>
    </>
  );
}
