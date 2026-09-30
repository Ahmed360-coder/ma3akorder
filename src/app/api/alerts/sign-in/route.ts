import { timingSafeEqual } from "node:crypto";
import { sendSignInAlert } from "@/lib/sign-in-email";

// Called by the database (trigger on auth.users, via pg_net) after every sign-in.
// The shared secret lives in Supabase Vault and in Vercel as SIGNIN_ALERT_SECRET.
export async function POST(req: Request) {
  const secret = process.env.SIGNIN_ALERT_SECRET;
  const given = req.headers.get("x-alert-secret") ?? "";
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const b = await req.json().catch(() => null);
  if (!b) return new Response("Bad request", { status: 400 });
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const sent = await sendSignInAlert({
    isNew: b.is_new === true,
    name: str(b.name),
    email: str(b.email),
    phone: str(b.phone),
    role: str(b.role) ?? "none",
    method: str(b.provider) ?? "email",
    at: b.at ? new Date(b.at) : new Date(),
  });
  return Response.json({ sent });
}
