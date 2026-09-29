import Link from "next/link";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";
import { LogoMark } from "@/components/logo";

export default async function LoginPage() {
  const { t } = await getDictionary();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoMark className="float-slow h-16 w-16 drop-shadow-[0_12px_30px_rgba(18,161,80,0.4)]" />
          <h1 className="text-2xl font-extrabold">{t.login.title}</h1>
        </div>
        <div className="card">
          <LoginForm t={t.login} />
        </div>
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
