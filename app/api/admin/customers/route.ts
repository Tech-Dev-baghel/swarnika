import { bad, isResponse, json, requireAdmin, str, withStore } from "@/lib/api";
import { createResetToken } from "@/lib/auth";
import { assertWritable, audit, customerRow, db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

/** Enable/disable a customer account. */
async function _PUT(req: Request) {
  const me = await requireAdmin("customers"); if (isResponse(me)) return me;
  assertWritable();
  const b = await req.json().catch(() => ({}));
  const id = str(b.id, 60);
  await (await db()).query(`update customers set active = $2, session_version = session_version + (case when $2 then 0 else 1 end) where id = $1`, [id, Boolean(b.active)]);
  await audit(me.email, `${b.active ? "Enabled" : "Disabled"} customer ${id}`);
  return json({ ok: true });
}

/** Creates a one-hour password reset link to share with a customer (e.g. on WhatsApp). */
async function _POST(req: Request) {
  const me = await requireAdmin("customers"); if (isResponse(me)) return me;
  assertWritable();
  const b = await req.json().catch(() => ({}));
  const row = await customerRow("id", str(b.id, 60));
  if (!row) return bad("Customer not found", 404);
  const token = await createResetToken("customer", row.id);
  await audit(me.email, `Created password reset link for customer ${row.id}`);
  return json({ link: `${SITE_URL}/reset-password?token=${token}` });
}
export const PUT = withStore(_PUT);
export const POST = withStore(_POST);
