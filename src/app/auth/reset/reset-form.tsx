"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function ResetForm({ t }: { t: Dictionary["login"] }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message.toLowerCase().includes("password") ? t.errors.weakPassword : error.message);
    setSaved(true);
    setTimeout(() => {
      router.replace("/account");
      router.refresh();
    }, 1200);
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => (e.preventDefault(), save())}>
      <label htmlFor="new-password" className="text-sm font-semibold">{t.newPasswordLabel}</label>
      <div className="relative">
        <input id="new-password" className="input pe-24" dir="ltr" type={show ? "text" : "password"} minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 end-0 flex min-w-11 items-center gap-1.5 px-3 text-xs font-semibold text-muted hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          {show ? t.hide : t.show}
        </button>
      </div>
      <p className="text-xs text-muted">{t.passwordHint}</p>
      <button className="btn-primary" disabled={busy || saved}>{busy ? t.working : t.savePassword}</button>
      {error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {saved && <p className="rounded-xl border border-positive/40 bg-positive/10 p-3 text-sm text-positive">{t.passwordSaved}</p>}
    </form>
  );
}
