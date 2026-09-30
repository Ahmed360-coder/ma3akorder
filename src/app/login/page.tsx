import Link from "next/link";
import { Header } from "@/components/header";
import { getDictionary } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";
import { LogoMark } from "@/components/logo";
import { getAuthMethods } from "@/lib/auth-methods";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ t }, methods, { error }] = await Promise.all([getDictionary(), getAuthMethods(), searchParams]);
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoMark className="float-slow h-16 w-16 drop-shadow-[0_12px_30px_rgba(12,21,40,0.3)]" />
          <div>
            <h1 className="text-2xl font-extrabold">{t.login.title}</h1>
            <p className="mt-1 text-sm text-muted">{t.login.subtitle}</p>
          </div>
        </div>
        <div className="card">
          <LoginForm t={t.login} methods={methods} initialError={error ? t.login.errors.linkExpired : undefined} />
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
