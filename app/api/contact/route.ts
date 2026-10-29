import { bad, isEmail, json, normEmail, str, withStore } from "@/lib/api";
import { addMessage, getSettings } from "@/lib/db";
import { messageAlert } from "@/lib/mail";
import { clientIp, limited } from "@/lib/ratelimit";

async function _POST(req: Request) {
  if (limited("contact:" + clientIp(req), 6, 10 * 60 * 1000)) return bad("Too many messages. Please call or WhatsApp us instead.", 429);
  const b = await req.json().catch(() => ({}));
  const m = { name: str(b.name, 80), email: normEmail(b.email), phone: str(b.phone, 20), subject: str(b.subject, 120), body: str(b.body, 3000) };
  if (!m.name || !m.body || (!isEmail(m.email) && m.phone.replace(/\D/g, "").length < 10)) return bad("Please add your name, a message, and an email or phone number so we can reply.");
  await addMessage(m);
  messageAlert((await getSettings()).email, m);
  return json({ ok: true }, 201);
}
export const POST = withStore(_POST);
