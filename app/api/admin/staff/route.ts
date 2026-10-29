import { bad, isEmail, isResponse, json, normEmail, requireAdmin, str, withStore } from "@/lib/api";
import { adminRow, assertWritable, audit, db, listAdmins, newId } from "@/lib/db";
import { hashPassword, passwordProblem } from "@/lib/password";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["owner", "manager", "staff"];

async function owners() { return (await listAdmins()).filter((a) => a.role === "owner" && a.active).length; }

async function _GET() {
  const me = await requireAdmin("staff"); if (isResponse(me)) return me;
  return json(await listAdmins());
}

async function _POST(req: Request) {
  const me = await requireAdmin("staff"); if (isResponse(me)) return me;
  assertWritable();
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80), email = normEmail(b.email), role = b.role as Role, password = String(b.password ?? "");
  if (!name || !isEmail(email)) return bad("Please enter a name and a valid email.");
  if (!ROLES.includes(role)) return bad("Choose a role.");
  const pw = passwordProblem(password); if (pw) return bad(pw);
  if (await adminRow("email", email)) return bad("A staff account with this email already exists.", 409);
  await (await db()).query(`insert into admins (id, name, email, password_hash, role) values ($1,$2,$3,$4,$5)`, [newId("adm"), name, email, await hashPassword(password), role]);
  await audit(me.email, `Added staff ${email} as ${role}`);
  return json({ ok: true }, 201);
}

async function _PUT(req: Request) {
  const me = await requireAdmin("staff"); if (isResponse(me)) return me;
  assertWritable();
  const b = await req.json().catch(() => ({}));
  const row = await adminRow("id", str(b.id, 60));
  if (!row) return bad("Not found", 404);
  const d = await db();
  const role = (b.role ?? row.role) as Role, active = b.active ?? row.active;
  if (!ROLES.includes(role)) return bad("Unknown role");
  if (row.role === "owner" && row.active && (role !== "owner" || !active) && (await owners()) <= 1) return bad("There must always be at least one active owner.");
  await d.query(`update admins set name = $2, role = $3, active = $4, session_version = session_version + (case when $4 then 0 else 1 end) where id = $1`, [row.id, str(b.name, 80) || row.name, role, Boolean(active)]);
  if (b.password) {
    const pw = passwordProblem(String(b.password)); if (pw) return bad(pw);
    await d.query(`update admins set password_hash = $2, session_version = session_version + 1 where id = $1`, [row.id, await hashPassword(String(b.password))]);
    await audit(me.email, `Reset password for ${row.email}`);
  }
  await audit(me.email, `Updated staff ${row.email}`, `role=${role} active=${active}`);
  return json({ ok: true });
}

async function _DELETE(req: Request) {
  const me = await requireAdmin("staff"); if (isResponse(me)) return me;
  assertWritable();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (id === me.id) return bad("You can't delete your own account.");
  const row = await adminRow("id", id);
  if (!row) return json({ ok: true });
  if (row.role === "owner" && (await owners()) <= 1) return bad("There must always be at least one active owner.");
  await (await db()).query(`delete from admins where id = $1`, [id]);
  await audit(me.email, `Deleted staff ${row.email}`);
  return json({ ok: true });
}
export const GET = withStore(_GET);
export const POST = withStore(_POST);
export const PUT = withStore(_PUT);
export const DELETE = withStore(_DELETE);
