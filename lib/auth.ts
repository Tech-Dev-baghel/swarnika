import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "sw_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const adminPassword = () => process.env.ADMIN_PASSWORD || "admin123";
const secret = () => process.env.SESSION_SECRET || "swarnika-dev-secret:" + adminPassword();

const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

export function makeToken() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function checkPassword(pw: string) {
  const a = Buffer.from(sign(pw)), b = Buffer.from(sign(adminPassword()));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function validToken(token?: string) {
  if (!token) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  const good = Buffer.from(sign(exp)), got = Buffer.from(mac);
  return good.length === got.length && crypto.timingSafeEqual(good, got);
}

export async function isAdmin() {
  const c = await cookies();
  return validToken(c.get(COOKIE)?.value);
}

export const cookieOptions = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: MAX_AGE, secure: process.env.COOKIE_SECURE === "1" };
