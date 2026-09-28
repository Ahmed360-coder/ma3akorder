"use client";

import { useState, useTransition } from "react";

// A button that runs a server action and shows its error, if any, underneath.
export function ActionButton({
  action,
  children,
  className = "btn-primary",
  confirmText,
}: {
  action: () => Promise<{ error: string | null } | void>;
  children: React.ReactNode;
  className?: string;
  confirmText?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          if (confirmText && !window.confirm(confirmText)) return;
          setError(null);
          start(async () => {
            const res = await action();
            if (res && res.error) setError(res.error);
          });
        }}
      >
        {pending ? "…" : children}
      </button>
      {error && <span role="alert" className="text-sm text-danger">{error}</span>}
    </span>
  );
}
