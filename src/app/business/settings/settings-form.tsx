"use client";

import { useActionState } from "react";
import { updateBusiness } from "../actions";

export function SettingsForm({ children, saveLabel, savedLabel }: { children: React.ReactNode; saveLabel: string; savedLabel: string }) {
  const [state, action, pending] = useActionState(updateBusiness, null);
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      {children}
      <button className="btn-primary" disabled={pending}>{pending ? "…" : saveLabel}</button>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-positive">{savedLabel}</p>}
    </form>
  );
}
