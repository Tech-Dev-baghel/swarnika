import { NextResponse } from "next/server";
import { bad, withStore } from "@/lib/api";
import { consumeResetToken, customerSessionCookie } from "@/lib/auth";
import { assertWritable, customerRow, db } from "@/lib/db";
import { hashPassword, passwordProblem } from "@/lib/password";

async function _POST(req: Request) {
  assertWritable();
  const { token, password } = await req.json().catch(() => ({}));
  const pw = passwordProblem(String(password ?? "")); if (pw) return bad(pw);
  const uid = await consumeResetToken("customer", String(token ?? ""));
  if (!uid) return bad("This reset link has expired or was already used. Please ask for a new one.", 400);
  await (await db()).query(`update customers set password_hash = $2, session_version = session_version + 1 where id = $1`, [uid, await hashPassword(String(password))]);
  const row = await customerRow("id", uid);
  const res = NextResponse.json({ ok: true });
  if (row) res.cookies.set(await customerSessionCookie(row));
  return res;
}
export const POST = withStore(_POST);
