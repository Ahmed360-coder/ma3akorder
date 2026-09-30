import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./reset-form";

// Password reset emails open this page (through /auth/callback, which signs the person in first).
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=link");
  const { t } = await getDictionary();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
        <h1 className="mb-6 text-center text-2xl font-extrabold">{t.login.newPasswordTitle}</h1>
        <div className="card">
          <ResetForm t={t.login} />
        </div>
      </main>
    </>
  );
}
