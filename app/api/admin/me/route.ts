import { NextResponse } from "next/server";
import { bad, isResponse, requireAdmin, str, withStore } from "@/lib/api";
import { adminSessionCookie } from "@/lib/auth";
import { adminRow, assertWritable, audit, db } from "@/lib/db";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";

async function _PUT(req: Request) {
  const me = await requireAdmin("dashboard"); if (isResponse(me)) return me;
  assertWritable();
  const b = await req.json().catch(() => ({}));
  const d = await db();
  if (b.name) await d.query(`update admins set name = $2 where id = $1`, [me.id, str(b.name, 80)]);
  if (b.password) {
    const row = (await adminRow("id", me.id))!;
    if (!(await verifyPassword(String(b.current ?? ""), row.password_hash))) return bad("Your current password isn't right.");
    const pw = passwordProblem(String(b.password)); if (pw) return bad(pw);
    const r = await d.query<{ session_version: number }>(`update admins set password_hash = $2, session_version = session_version + 1 where id = $1 returning session_version`, [me.id, await hashPassword(String(b.password))]);
    await audit(me.email, "Changed own password");
    const res = NextResponse.json({ ok: true });
    res.cookies.set(await adminSessionCookie({ id: me.id, session_version: r[0].session_version }));
    return res;
  }
  return NextResponse.json({ ok: true });
}
export const PUT = withStore(_PUT);
