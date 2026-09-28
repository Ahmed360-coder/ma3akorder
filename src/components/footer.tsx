import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { SUPPORT_WHATSAPP } from "@/lib/site";

export async function Footer() {
  const { t } = await getDictionary();
  return (
    <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-line px-4 py-6 text-sm text-muted">
      <Link href="/privacy" className="hover:text-foreground">{t.site.privacy}</Link>
      <Link href="/terms" className="hover:text-foreground">{t.site.terms}</Link>
      {SUPPORT_WHATSAPP && (
        <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          {t.site.support}
        </a>
      )}
      <span>© 2026 M3akOrder</span>
    </footer>
  );
}
