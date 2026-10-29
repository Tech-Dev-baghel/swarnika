import { NextResponse } from "next/server";
import { bad, isEmail, normEmail, str, withStore } from "@/lib/api";
import { adminSessionCookie } from "@/lib/auth";
import { adminCount, assertWritable, audit, db, newId } from "@/lib/db";
import { hashPassword, passwordProblem } from "@/lib/password";

/** Creates the first (owner) account. Only works while there are no staff accounts at all. */
async function _POST(req: Request) {
  assertWritable();
  if ((await adminCount()) > 0) return bad("Setup is already done. Please sign in.", 403);
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80), email = normEmail(b.email), password = String(b.password ?? "");
  if (!name || !isEmail(email)) return bad("Please enter your name and a valid email.");
  const pw = passwordProblem(password); if (pw) return bad(pw);
  const id = newId("adm");
  const r = await (await db()).query<{ id: string }>(
    `insert into admins (id, name, email, password_hash, role, last_login) select $1,$2,$3,$4,'owner', now() where not exists (select 1 from admins) returning id`,
    [id, name, email, await hashPassword(password)]);
  if (!r.length) return bad("Setup is already done. Please sign in.", 403);
  await audit(email, "Created owner account");
  const res = NextResponse.json({ ok: true }, { status: 201 });
  res.cookies.set(await adminSessionCookie({ id, session_version: 1 }));
  return res;
}
export const POST = withStore(_POST);
