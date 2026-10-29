import { NextResponse } from "next/server";
import { bad, withStore } from "@/lib/api";
import { customerSessionCookie } from "@/lib/auth";
import { findCustomer } from "@/lib/customer-auth";
import { db, isPersistent } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { clear, clientIp, record, tooMany } from "@/lib/ratelimit";

async function _POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const key = `clogin:${clientIp(req)}:${String(b.identifier ?? "").trim().toLowerCase()}`;
  if (tooMany(key, 10, 15 * 60 * 1000)) return bad("Too many wrong attempts. Please wait 15 minutes or reset your password.", 429);
  const row = await findCustomer(String(b.identifier ?? ""));
  if (!row || !(await verifyPassword(String(b.password ?? ""), row.password_hash))) { record(key); return bad("Wrong email/phone or password.", 401); }
  if (!row.active) return bad("This account has been disabled. Please contact us.", 403);
  clear(key);
  if (isPersistent()) await (await db()).query(`update customers set last_login = now() where id = $1`, [row.id]);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(await customerSessionCookie(row));
  return res;
}
export const POST = withStore(_POST);
