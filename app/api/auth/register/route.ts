import { NextResponse } from "next/server";
import { bad, isEmail, normEmail, normPhone, str, withStore } from "@/lib/api";
import { customerSessionCookie } from "@/lib/auth";
import { assertWritable, customerRow, db, getSettings, newId } from "@/lib/db";
import { welcomeEmail } from "@/lib/mail";
import { hashPassword, passwordProblem } from "@/lib/password";
import { clientIp, limited } from "@/lib/ratelimit";

async function _POST(req: Request) {
  if (limited("reg:" + clientIp(req), 8, 30 * 60 * 1000)) return bad("Too many sign-ups from this connection. Please try later.", 429);
  assertWritable();
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80), email = normEmail(b.email), phone = normPhone(b.phone), password = String(b.password ?? "");
  if (!name) return bad("Please enter your name.");
  if (email && !isEmail(email)) return bad("That email doesn't look right.");
  if (!email && !phone) return bad("Please enter an email or a 10-digit mobile number.");
  if (b.phone && !phone) return bad("Please enter a valid 10-digit mobile number.");
  const pw = passwordProblem(password); if (pw) return bad(pw);
  if (email && (await customerRow("email", email))) return bad("An account with this email already exists. Please log in.", 409);
  if (phone && (await customerRow("phone", phone))) return bad("An account with this mobile number already exists. Please log in.", 409);
  const id = newId("cus");
  await (await db()).query(`insert into customers (id, name, email, phone, password_hash, last_login) values ($1,$2,$3,$4,$5, now())`, [id, name, email || null, phone || null, await hashPassword(password)]);
  if (email) welcomeEmail(email, (await getSettings()).brandName, name);
  const res = NextResponse.json({ ok: true }, { status: 201 });
  res.cookies.set(await customerSessionCookie({ id, session_version: 1 }));
  return res;
}
export const POST = withStore(_POST);
