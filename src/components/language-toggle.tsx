import { toggleLocale } from "@/lib/i18n/actions";

export function LanguageToggle({ label }: { label: string }) {
  return (
    <form action={toggleLocale}>
      <button type="submit" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground">
        {label}
      </button>
    </form>
  );
}
