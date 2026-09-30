"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Mail, MailCheck, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AuthMethods } from "@/lib/auth-methods";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type T = Dictionary["login"];
type View = "main" | "phone" | "link-sent" | "forgot" | "reset-sent";
type Mode = "signin" | "signup";
type Provider = "google" | "apple" | "facebook";

// Egyptian mobile numbers: 01xxxxxxxxx locally, +201xxxxxxxxx internationally.
function toE164(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("20")) return `+${digits}`;
  if (digits.startsWith("0")) return `+2${digits}`;
  return `+20${digits}`;
}

// Supabase answers in English; show the common cases in the visitor's language.
function friendly(message: string, t: T) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return t.errors.badLogin;
  if (m.includes("already registered") || m.includes("already been registered")) return t.errors.exists;
  if (m.includes("email not confirmed")) return t.errors.notConfirmed;
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return t.errors.tooMany;
  if (m.includes("provider is not enabled") || m.includes("not authorized")) return t.errors.unavailable;
  if (m.includes("password should be")) return t.errors.weakPassword;
  if (m.includes("token has expired") || m.includes("invalid")) return t.errors.badCode;
  return message;
}

const PROVIDER_STYLE: Record<Provider, string> = {
  google: "border border-line bg-surface text-foreground hover:bg-surface-2",
  apple: "bg-black text-white hover:bg-neutral-800",
  facebook: "bg-[#1877F2] text-white hover:brightness-105",
};

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "google")
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.9 11.9 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
      </svg>
    );
  if (provider === "apple")
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.8-2-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9c-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6s1.8-.8 3.4-.8 2 .8 3.4.8 2.3-1.3 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3-1.5z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
    </svg>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="hit inline-flex items-center gap-1.5 self-start text-sm font-semibold text-muted hover:text-foreground">
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      {label}
    </button>
  );
}

function Sent({ icon, title, body, children }: { icon: ReactNode; title: string; body: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-tile text-accent">{icon}</span>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted">{body}</p>
      {children}
    </div>
  );
}

export function LoginForm({ t, methods, initialError }: { t: T; methods: AuthMethods; initialError?: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [view, setView] = useState<View>("main");
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const origin = () => window.location.origin;
  const providers = (["google", "apple", "facebook"] as const).filter((p) => methods[p]);
  const hasShortcuts = providers.length > 0 || methods.phone;

  function go(next: View) {
    setError(null);
    setNotice(null);
    setView(next);
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(friendly(e instanceof Error ? e.message : String(e), t));
    } finally {
      setBusy(false);
    }
  }

  const done = () => {
    router.replace("/account");
    router.refresh();
  };

  const oauth = (provider: Provider) =>
    run(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${origin()}/auth/callback` },
      });
      if (error) throw error;
    });

  const sendCode = () =>
    run(async () => {
      const e164 = toE164(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
      if (error) throw error;
      setCodeSentTo(e164);
    });

  const verifyCode = () =>
    run(async () => {
      const { error } = await supabase.auth.verifyOtp({ phone: codeSentTo!, token: code, type: "sms" });
      if (error) throw error;
      done();
    });

  const emailSubmit = () =>
    run(async () => {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin()}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) done();
        else setNotice(t.checkEmail);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        done();
      }
    });

  const sendLink = () =>
    run(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin()}/auth/callback` },
      });
      if (error) throw error;
      setView("link-sent");
    });

  const sendReset = () =>
    run(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin()}/auth/callback?next=/auth/reset`,
      });
      if (error) throw error;
      setView("reset-sent");
    });

  const emailField = (
    <label className="flex flex-col gap-2 text-sm font-semibold">
      {t.emailLabel}
      <input className="input" dir="ltr" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
    </label>
  );

  let body: ReactNode;
  if (view === "phone") {
    body = (
      <div className="flex flex-col gap-4">
        <BackButton label={t.back} onClick={() => (codeSentTo ? (setCodeSentTo(null), setCode("")) : go("main"))} />
        {codeSentTo ? (
          <form className="flex flex-col gap-3" onSubmit={(e) => (e.preventDefault(), verifyCode())}>
            <p className="text-sm text-muted">
              {t.codeSent} <span dir="ltr">{codeSentTo}</span>
            </p>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              {t.codeLabel}
              <input className="input text-center text-lg tracking-[0.4em]" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
            </label>
            <button className="btn-primary" disabled={busy}>{busy ? t.working : t.verify}</button>
            <button type="button" className="text-sm font-semibold text-muted underline-offset-4 hover:underline" onClick={sendCode} disabled={busy}>
              {t.resendCode}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={(e) => (e.preventDefault(), sendCode())}>
            <h2 className="text-lg font-bold">{t.phoneTitle}</h2>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              {t.phoneLabel}
              <div className="flex gap-2" dir="ltr">
                <span className="grid h-12 place-items-center rounded-xl border border-line bg-surface-2 px-3 text-sm font-semibold">+20</span>
                <input className="input" type="tel" inputMode="tel" autoComplete="tel-national" placeholder={t.phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </label>
            <button className="btn-primary" disabled={busy}>{busy ? t.working : t.sendCode}</button>
          </form>
        )}
      </div>
    );
  } else if (view === "forgot") {
    body = (
      <form className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), sendReset())}>
        <BackButton label={t.back} onClick={() => go("main")} />
        <div>
          <h2 className="text-lg font-bold">{t.forgotTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.forgotBody}</p>
        </div>
        {emailField}
        <button className="btn-primary" disabled={busy}>{busy ? t.working : t.sendResetLink}</button>
      </form>
    );
  } else if (view === "link-sent" || view === "reset-sent") {
    body = (
      <Sent
        icon={<MailCheck className="h-7 w-7" aria-hidden="true" />}
        title={t.checkInbox}
        body={
          <>
            {view === "link-sent" ? t.linkSentBody : t.resetSentBody} <span dir="ltr" className="font-semibold text-foreground">{email}</span>
          </>
        }
      >
        <p className="text-xs text-muted">{t.sameDevice}</p>
        <button type="button" className="btn-ghost mt-2 w-full" onClick={() => go("main")}>
          {t.useAnother}
        </button>
      </Sent>
    );
  } else {
    body = (
      <div className="flex flex-col gap-5">
        {hasShortcuts && (
          <div className="flex flex-col gap-2.5">
            {providers.map((p) => (
              <button key={p} type="button" onClick={() => oauth(p)} disabled={busy} className={`btn w-full ${PROVIDER_STYLE[p]}`}>
                <ProviderIcon provider={p} />
                {t.continueWith[p]}
              </button>
            ))}
            {methods.phone && (
              <button type="button" onClick={() => go("phone")} disabled={busy} className="btn-ghost w-full">
                <Smartphone className="h-5 w-5 text-accent" aria-hidden="true" />
                {t.continueWith.phone}
              </button>
            )}
          </div>
        )}

        {hasShortcuts && (
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-line" />
            {t.orEmail}
            <span className="h-px flex-1 bg-line" />
          </div>
        )}

        <div className="grid grid-cols-2 rounded-xl border border-line bg-surface-2 p-1" role="tablist" aria-label={t.emailTab}>
          {(["signin", "signup"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => (setMode(key), setError(null), setNotice(null))}
              className={`relative h-10 rounded-lg text-sm font-semibold transition-colors ${mode === key ? "text-foreground" : "text-muted"}`}
            >
              {mode === key && <m.span layoutId="login-mode" className="absolute inset-0 rounded-lg bg-surface shadow-sm" transition={{ duration: 0.2 }} />}
              <span className="relative">{key === "signin" ? t.signIn : t.signUp}</span>
            </button>
          ))}
        </div>

        <form className="flex flex-col gap-3" onSubmit={(e) => (e.preventDefault(), emailSubmit())}>
          {emailField}
          <div className="flex flex-col gap-2 text-sm font-semibold">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password">{t.passwordLabel}</label>
              {mode === "signin" && methods.emailLinks && (
                <button type="button" className="text-sm font-semibold text-accent underline-offset-4 hover:underline" onClick={() => go("forgot")}>
                  {t.forgot}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="login-password"
                className="input pe-24"
                dir="ltr"
                type={showPassword ? "text" : "password"}
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex min-w-11 items-center gap-1.5 px-3 text-xs font-semibold text-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                {showPassword ? t.hide : t.show}
              </button>
            </div>
            {mode === "signup" && <p className="text-xs font-normal text-muted">{t.passwordHint}</p>}
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? t.working : mode === "signup" ? t.signUp : t.signIn}</button>
        </form>

        {methods.emailLinks && (
          <button
            type="button"
            className="btn-ghost w-full"
            disabled={busy}
            onClick={() => (email ? sendLink() : setError(t.enterEmailFirst))}
          >
            <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
            {t.emailMeLink}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={view + (codeSentTo ? "-code" : "")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {body}
        </m.div>
      </AnimatePresence>

      {error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {notice && <p className="rounded-xl border border-positive/40 bg-positive/10 p-3 text-sm text-positive">{notice}</p>}
    </div>
  );
}
