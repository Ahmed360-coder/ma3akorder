"use client";

import { useOptimistic, useTransition } from "react";
import { setStoreOpen } from "./actions";

export function OpenSwitch({ open, label }: { open: boolean; label: string }) {
  const [value, setValue] = useOptimistic(open);
  const [, start] = useTransition();
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() =>
          start(async () => {
            setValue(!value);
            await setStoreOpen(!value);
          })
        }
        className={`relative h-7 w-12 rounded-full transition ${value ? "bg-positive" : "bg-surface-2"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${value ? "start-6" : "start-1"}`} />
      </button>
    </label>
  );
}
