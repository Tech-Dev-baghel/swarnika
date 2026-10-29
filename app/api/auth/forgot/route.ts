import { bad, json, withStore } from "@/lib/api";
import { createResetToken } from "@/lib/auth";
import { findCustomer } from "@/lib/customer-auth";
import { assertWritable, getSettings } from "@/lib/db";
import { mailEnabled, resetEmail } from "@/lib/mail";
import { clientIp, limited } from "@/lib/ratelimit";
import { SITE_URL } from "@/lib/site";

async function _POST(req: Request) {
  if (limited("forgot:" + clientIp(req), 5, 30 * 60 * 1000)) return bad("Too many requests. Please try later.", 429);
  assertWritable();
  const { identifier } = await req.json().catch(() => ({}));
  const s = await getSettings();
  if (!mailEnabled()) return json({ ok: true, message: `Please call or WhatsApp us at ${s.phone} and we'll send you a reset link.` });
  const row = await findCustomer(String(identifier ?? ""));
  if (row?.email && row.active) {
    const token = await createResetToken("customer", row.id);
    await resetEmail(row.email, s.brandName, `${SITE_URL}/reset-password?token=${token}`, row.name);
  }
  // Same answer either way, so nobody can test which accounts exist.
  return json({ ok: true, message: "If an account with an email exists, we've sent a reset link. It works for 1 hour." });
}
export const POST = withStore(_POST);
