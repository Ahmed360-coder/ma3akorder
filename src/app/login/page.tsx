import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const { t } = await getDictionary();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
        <h1 className="mb-6 text-2xl font-bold">{t.login.title}</h1>
        <LoginForm t={t.login} />
      </main>
    </>
  );
}
