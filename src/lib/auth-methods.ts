import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Sign-in links by email (magic link and "forgot password") need a real email sender (custom SMTP)
// in Supabase. Supabase's built-in sender only mails the project's own team, so these stay hidden
// until SMTP is set up. Flip this to true once it is.
export const EMAIL_LINKS_READY = false;

export type AuthMethods = {
  google: boolean;
  apple: boolean;
  facebook: boolean;
  phone: boolean;
  emailLinks: boolean;
};

// Asks Supabase which sign-in providers are switched on, so a button only shows once it works.
// Adding keys in the Supabase dashboard makes the matching button appear within a minute, no deploy needed.
export async function getAuthMethods(): Promise<AuthMethods> {
  let external: Record<string, boolean> = {};
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 60 },
    });
    if (res.ok) external = (await res.json()).external ?? {};
  } catch {
    // Supabase unreachable: fall back to email and password only.
  }
  return {
    google: !!external.google,
    apple: !!external.apple,
    facebook: !!external.facebook,
    phone: !!external.phone,
    emailLinks: EMAIL_LINKS_READY,
  };
}
