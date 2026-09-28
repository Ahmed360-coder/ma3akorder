import Link from "next/link";
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
        <p className="mt-6 text-center text-sm text-muted">
          {t.site.consent.split(/(\{terms\}|\{privacy\})/).map((part, i) =>
            part === "{terms}" ? (
              <Link key={i} href="/terms" className="text-foreground underline underline-offset-4">{t.site.terms}</Link>
            ) : part === "{privacy}" ? (
              <Link key={i} href="/privacy" className="text-foreground underline underline-offset-4">{t.site.privacy}</Link>
            ) : (
              part
            ),
          )}
        </p>
      </main>
    </>
  );
}
