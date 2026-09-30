import { getDictionary } from "@/lib/i18n/server";
import { SUPPORT_WHATSAPP } from "@/lib/site";

// Floating help button that opens a WhatsApp chat with support.
export async function WhatsAppButton() {
  if (!SUPPORT_WHATSAPP) return null;
  const { t } = await getDictionary();
  return (
    <a
      href={`https://wa.me/${SUPPORT_WHATSAPP}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.site.support}
      title={t.site.support}
      className="whatsapp-fab fixed bottom-4 end-4 z-40 inline-flex h-11 items-center gap-1.5 rounded-full bg-[#25D366] ps-2.5 pe-3.5 sm:h-12 sm:gap-2 sm:ps-3 sm:pe-4 font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 1 1 7.98 4.41zm8-17.45A11.3 11.3 0 0 0 12.05.75C5.8.75.72 5.83.72 12.07c0 2 .52 3.94 1.51 5.66L.62 23.25l5.65-1.48a11.3 11.3 0 0 0 5.77 1.47h.01c6.24 0 11.32-5.08 11.32-11.32 0-3.03-1.18-5.87-3.32-8z" />
      </svg>
      <span className="text-sm">{t.ui.help}</span>
    </a>
  );
}
