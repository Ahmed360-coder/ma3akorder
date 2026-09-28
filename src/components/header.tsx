import Link from "next/link";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Header({ t }: { t: Dictionary }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
      <Link href="/" aria-label={t.brand}>
        <Logo name={t.brand} />
      </Link>
      <LanguageToggle label={t.switchLanguage} />
    </header>
  );
}
