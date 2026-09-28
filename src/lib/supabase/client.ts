import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );
}
