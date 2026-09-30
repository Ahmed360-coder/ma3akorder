import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google/Apple/Facebook sign-in, email sign-in links, confirmation and password reset links
// all land here with a one-time code. `next` picks where to go after (same-site paths only).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
