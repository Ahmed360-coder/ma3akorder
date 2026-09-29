import { NextResponse } from "next/server";
import { getDictionary } from "@/lib/i18n/server";
import { getSearchData } from "@/lib/search-data";

// The search screen opens instantly and loads its stores and items from here in the background.
export async function GET() {
  const { t, locale } = await getDictionary();
  return NextResponse.json(await getSearchData(t, locale), { headers: { "Cache-Control": "private, no-store" } });
}
