import { Languages } from "lucide-react";
import { toggleLocale } from "@/lib/i18n/actions";

export function LanguageToggle({ label }: { label: string }) {
  return (
    <form action={toggleLocale}>
      <button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground">
        <Languages className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}
