import { bad, json, normEmail, withStore } from "@/lib/api";
import { createResetToken } from "@/lib/auth";
import { adminRow, assertWritable, getSettings } from "@/lib/db";
import { mailEnabled, resetEmail } from "@/lib/mail";
import { clientIp, limited } from "@/lib/ratelimit";
import { SITE_URL } from "@/lib/site";

async function _POST(req: Request) {
  if (limited("aforgot:" + clientIp(req), 5, 30 * 60 * 1000)) return bad("Too many requests. Please try later.", 429);
  assertWritable();
  if (!mailEnabled()) return json({ ok: true, message: "Email isn't set up on this site yet. Ask the owner to reset your password from Admin → Staff." });
  const { email } = await req.json().catch(() => ({}));
  const row = await adminRow("email", normEmail(email));
  if (row?.active) {
    const token = await createResetToken("admin", row.id);
    await resetEmail(row.email, (await getSettings()).brandName + " Admin", `${SITE_URL}/admin/reset?token=${token}`, row.name);
  }
  return json({ ok: true, message: "If that email belongs to a staff account, a reset link is on its way. It works for 1 hour." });
}
export const POST = withStore(_POST);
