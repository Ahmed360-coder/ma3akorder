"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Mail, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Tab = "phone" | "email";

// Egyptian mobile numbers: 01xxxxxxxxx locally, +201xxxxxxxxx internationally.
function toE164(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("20")) return `+${digits}`;
  if (digits.startsWith("0")) return `+2${digits}`;
  return `+20${digits}`;
}

export function LoginForm({ t }: { t: Dictionary["login"] }) {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const done = () => {
    router.replace("/account");
    router.refresh();
  };

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
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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

  const google = () =>
    run(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    });

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={google} disabled={busy} className="btn-ghost w-full">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6z" />
        </svg>
        {t.google}
      </button>

      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-line" />
        {t.or}
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 rounded-xl border border-line bg-surface p-1" role="tablist">
        {(["phone", "email"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`relative h-10 rounded-lg text-sm font-semibold transition-colors ${tab === key ? "text-foreground" : "text-muted"}`}
          >
            {tab === key && <m.span layoutId="login-tab" className="absolute inset-0 rounded-lg border border-line bg-surface-2" />}
            <span className="relative inline-flex items-center gap-2">
              {key === "phone" ? <Smartphone className="h-4 w-4" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
              {key === "phone" ? t.phoneTab : t.emailTab}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
      <m.div key={tab + (codeSentTo ? "-code" : "")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
      {tab === "phone" ? (
        codeSentTo ? (
          <form className="flex flex-col gap-3" onSubmit={(e) => (e.preventDefault(), verifyCode())}>
            <p className="text-sm text-muted">
              {t.codeSent} <span dir="ltr">{codeSentTo}</span>
            </p>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              {t.codeLabel}
              <input className="input tracking-[0.4em]" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
            </label>
            <button className="btn-primary" disabled={busy}>{busy ? t.working : t.verify}</button>
          </form>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={(e) => (e.preventDefault(), sendCode())}>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              {t.phoneLabel}
              <input className="input" dir="ltr" type="tel" inputMode="tel" autoComplete="tel" placeholder={t.phonePlaceholder} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
            <button className="btn-primary" disabled={busy}>{busy ? t.working : t.sendCode}</button>
          </form>
        )
      ) : (
        <form className="flex flex-col gap-3" onSubmit={(e) => (e.preventDefault(), emailSubmit())}>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            {t.emailLabel}
            <input className="input" dir="ltr" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            {t.passwordLabel}
            <input className="input" dir="ltr" type="password" minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn-primary" disabled={busy}>{busy ? t.working : isSignUp ? t.signUp : t.signIn}</button>
          <button type="button" className="text-sm text-muted underline-offset-4 hover:underline" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? t.haveAccount : t.noAccount}
          </button>
        </form>
      )}
      </m.div>
      </AnimatePresence>

      {error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {notice && <p className="rounded-xl border border-positive/40 bg-positive/10 p-3 text-sm text-positive">{notice}</p>}
    </div>
  );
}
