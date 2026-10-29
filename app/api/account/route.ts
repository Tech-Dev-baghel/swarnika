import { bad, isEmail, isResponse, json, normEmail, normPhone, requireCustomer, str, withStore } from "@/lib/api";
import { assertWritable, customerRow, db } from "@/lib/db";

async function _GET() {
  const me = await requireCustomer(); if (isResponse(me)) return me;
  return json(me);
}

async function _PUT(req: Request) {
  const me = await requireCustomer(); if (isResponse(me)) return me;
  assertWritable();
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80) || me.name, email = normEmail(b.email), phone = normPhone(b.phone);
  if (email && !isEmail(email)) return bad("That email doesn't look right.");
  if (!email && !phone) return bad("Keep at least an email or a mobile number on your account.");
  if (email && email !== me.email) { const o = await customerRow("email", email); if (o && o.id !== me.id) return bad("Another account already uses this email.", 409); }
  if (phone && phone !== me.phone) { const o = await customerRow("phone", phone); if (o && o.id !== me.id) return bad("Another account already uses this mobile number.", 409); }
  await (await db()).query(`update customers set name = $2, email = $3, phone = $4 where id = $1`, [me.id, name, email || null, phone || null]);
  return json({ ok: true });
}
export const GET = withStore(_GET);
export const PUT = withStore(_PUT);
