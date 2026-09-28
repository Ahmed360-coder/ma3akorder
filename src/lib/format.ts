export function formatEGP(amount: number | string, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(iso));
}

export function pickName(locale: string, ar: string | null | undefined, en: string | null | undefined) {
  return (locale === "en" ? en || ar : ar || en) ?? "";
}
