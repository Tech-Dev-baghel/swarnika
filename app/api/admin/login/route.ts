import { NextResponse } from "next/server";
import { bad, normEmail, withStore } from "@/lib/api";
import { adminSessionCookie } from "@/lib/auth";
import { adminRow, audit, db, isPersistent } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { clear, clientIp, record, tooMany } from "@/lib/ratelimit";

const WINDOW = 15 * 60 * 1000;

async function _POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = normEmail(b.email);
  // Count failures per IP + email, so one person mistyping doesn't lock out the whole shop's network.
  const key = `alogin:${clientIp(req)}:${email}`;
  if (tooMany(key, 8, WINDOW)) return bad("Too many wrong attempts. Please wait 15 minutes and try again.", 429);
  const row = email ? await adminRow("email", email) : null;
  if (!row || !(await verifyPassword(String(b.password ?? ""), row.password_hash))) {
    record(key);
    await audit(email || "unknown", "Failed admin sign-in", clientIp(req));
    return bad("Wrong email or password.", 401);
  }
  if (!row.active) return bad("This staff account is disabled. Ask the owner to enable it.", 403);
  clear(key);
  if (isPersistent()) await (await db()).query(`update admins set last_login = now() where id = $1`, [row.id]);
  await audit(row.email, "Signed in", clientIp(req));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(await adminSessionCookie(row));
  return res;
}
export const POST = withStore(_POST);
