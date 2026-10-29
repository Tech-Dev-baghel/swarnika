import { NextResponse } from "next/server";
import { bad, isResponse, requireCustomer, withStore } from "@/lib/api";
import { customerSessionCookie } from "@/lib/auth";
import { assertWritable, customerRow, db } from "@/lib/db";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";

async function _PUT(req: Request) {
  const me = await requireCustomer(); if (isResponse(me)) return me;
  assertWritable();
  const { current, password } = await req.json().catch(() => ({}));
  const row = (await customerRow("id", me.id))!;
  if (!(await verifyPassword(String(current ?? ""), row.password_hash))) return bad("Your current password isn't right.");
  const pw = passwordProblem(String(password ?? "")); if (pw) return bad(pw);
  const r = await (await db()).query<{ session_version: number }>(`update customers set password_hash = $2, session_version = session_version + 1 where id = $1 returning session_version`, [me.id, await hashPassword(String(password))]);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(await customerSessionCookie({ id: me.id, session_version: r[0].session_version })); // other devices are signed out
  return res;
}
export const PUT = withStore(_PUT);
