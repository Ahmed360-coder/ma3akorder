// Emails the owner each time someone signs in; the first sign-in of a new account is
// marked as new. Sent through Resend (https://resend.com); does nothing until
// RESEND_API_KEY is set in Vercel.
// Without a verified domain Resend only delivers to the Resend account's own email,
// which is exactly who this goes to.
const OWNER_EMAIL = process.env.SIGNUP_ALERT_TO ?? "solidmido7@gmail.com";
const FROM = process.env.SIGNUP_ALERT_FROM ?? "M3akOrder <onboarding@resend.dev>";
const SITE = "https://ma3akorder.vercel.app";
const CRIMSON = "#CB202D";

export type SignInInfo = {
  isNew: boolean;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  method: string;
  at: Date;
};

const ROLE_LABEL: Record<string, string> = {
  none: "Not chosen yet",
  customer: "Customer",
  business_staff: "Store staff",
  admin: "Admin",
  business_owner: "Store owner (needs your approval)",
  driver: "Driver (needs your approval)",
};

const METHOD_LABEL: Record<string, string> = {
  email: "Email and password",
  phone: "Phone (SMS code)",
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function signInEmail(info: SignInInfo) {
  const role = ROLE_LABEL[info.role] ?? info.role;
  const method = METHOD_LABEL[info.method] ?? info.method;
  const when = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    dateStyle: "full",
    timeStyle: "short",
  }).format(info.at);
  const who = info.name || info.email || info.phone || "Someone";
  const needsApproval = info.role === "business_owner" || info.role === "driver";
  const headline = info.isNew ? `${esc(who)} just joined M3akOrder` : `${esc(who)} signed in`;
  const note = info.isNew
    ? "This is a brand-new account signing in for the first time."
    : needsApproval
      ? "This account is waiting for your approval before it can go live."
      : "A returning user just signed in.";

  const rows: [string, string][] = [
    ["Name", info.name || "Not given"],
    ["Email", info.email || "Not given"],
    ["Phone", info.phone || "Not given"],
    ["Account type", role],
    ["Signs in with", method],
    ["Time (Cairo)", when],
  ];

  const subject = info.isNew ? `New account on M3akOrder: ${who}` : `Sign-in on M3akOrder: ${who}`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f1ea;font-family:Helvetica,Arial,sans-serif;color:#1f1f1f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ea;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
<tr><td style="background:${CRIMSON};padding:22px 28px">
  <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:.3px">M3akOrder</div>
  <div style="font-size:13px;color:#ffe3e5;margin-top:4px">${info.isNew ? "New account" : "Sign-in alert"}</div>
</td></tr>
<tr><td style="padding:28px">
  ${info.isNew ? `<div style="display:inline-block;background:#fde8ea;color:${CRIMSON};font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:10px">NEW ACCOUNT</div>` : ""}
  <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3">${headline}</h1>
  <p style="margin:0 0 20px;font-size:14px;color:#555">${note}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:12px;border-collapse:separate">
  ${rows
    .map(
      ([k, v], i) => `<tr>
    <td style="padding:11px 14px;font-size:13px;color:#777;width:38%;${i ? "border-top:1px solid #eee;" : ""}">${k}</td>
    <td style="padding:11px 14px;font-size:14px;font-weight:600;${i ? "border-top:1px solid #eee;" : ""}">${esc(v)}</td>
  </tr>`,
    )
    .join("")}
  </table>
  <div style="text-align:center;margin:26px 0 4px">
    <a href="${SITE}/admin" style="display:inline-block;background:${CRIMSON};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px">${
      needsApproval ? "Review in admin" : "Open admin"
    }</a>
  </div>
</td></tr>
<tr><td style="padding:16px 28px;background:#fbf7f2;font-size:12px;color:#999;text-align:center">
  You get this email each time someone signs in to <a href="${SITE}" style="color:${CRIMSON};text-decoration:none">ma3akorder.vercel.app</a>.
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [info.isNew ? `${who} just joined M3akOrder.` : `${who} signed in to M3akOrder.`, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", `Admin: ${SITE}/admin`].join("\n");

  return { subject, html, text };
}

export async function sendSignInAlert(info: SignInInfo) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const { subject, html, text } = signInEmail(info);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [OWNER_EMAIL], subject, html, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("sign-in alert failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("sign-in alert failed", e);
    return false;
  }
}
