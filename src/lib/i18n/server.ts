import { cookies } from "next/headers";
import { defaultLocale, dictionaries, locales, type Locale } from "./dictionaries";

export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale], dir: locale === "ar" ? "rtl" : "ltr" } as const;
}
