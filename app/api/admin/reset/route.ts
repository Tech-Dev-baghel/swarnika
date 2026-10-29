import { bad, json, withStore } from "@/lib/api";
import { consumeResetToken } from "@/lib/auth";
import { adminRow, assertWritable, audit, db } from "@/lib/db";
import { hashPassword, passwordProblem } from "@/lib/password";

async function _POST(req: Request) {
  assertWritable();
  const { token, password } = await req.json().catch(() => ({}));
  const pw = passwordProblem(String(password ?? "")); if (pw) return bad(pw);
  const uid = await consumeResetToken("admin", String(token ?? ""));
  if (!uid) return bad("This reset link has expired or was already used.");
  await (await db()).query(`update admins set password_hash = $2, session_version = session_version + 1 where id = $1`, [uid, await hashPassword(String(password))]);
  const a = await adminRow("id", uid);
  await audit(a?.email ?? uid, "Reset password with email link");
  return json({ ok: true });
}
export const POST = withStore(_POST);
