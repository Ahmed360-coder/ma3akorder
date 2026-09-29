import { getDictionary } from "@/lib/i18n/server";
import { searchLabels } from "@/lib/search-data";
import { SearchScreen } from "./search-screen";

// Only labels here, so the screen (and its keyboard) opens at once; results load in the background.
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { t, locale } = await getDictionary();
  return <SearchScreen initialQuery={q ?? ""} locale={locale} labels={searchLabels(t)} />;
}
