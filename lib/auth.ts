import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { adminRow, customerRow, db, toAdmin, toCustomer } from "./db";
import type { AdminUser, Customer, Role } from "./types";

export const ADMIN_COOKIE = "sw_admin";
export const CUST_COOKIE = "sw_cust";
const ADMIN_DAYS = 7, CUST_DAYS = 30;

let secretCache: string | null = null;
async function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (secretCache) return secretCache;
  // No SESSION_SECRET set: generate one once and keep it in the database.
  const d = await db();
  const fresh = crypto.randomBytes(32).toString("hex");
  await d.query(`insert into kv (key, value) values ('session_secret', $1) on conflict do nothing`, [JSON.stringify(fresh)]).catch(() => {});
  const r = await d.query<{ value: string }>(`select value from kv where key = 'session_secret'`);
  secretCache = r[0]?.value ?? fresh;
  return secretCache;
}

const mac = async (s: string) => crypto.createHmac("sha256", await secret()).update(s).digest("hex");

async function makeToken(type: "a" | "c", uid: string, ver: number, days: number) {
  const exp = Date.now() + days * 864e5;
  const body = `${uid}.${ver}.${exp}`;
  return `${body}.${await mac(`${type}:${body}`)}`;
}

async function readToken(type: "a" | "c", token?: string) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [uid, ver, exp, sig] = parts;
  if (Number(exp) < Date.now()) return null;
  const want = Buffer.from(await mac(`${type}:${uid}.${ver}.${exp}`));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  return { uid, ver: Number(ver) };
}

export const cookieOpts = (days: number) => ({
  httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: days * 86400,
  secure: process.env.COOKIE_SECURE === "1" || (process.env.NODE_ENV === "production" && !!process.env.VERCEL),
});

/* ---------- admin ---------- */

export const adminSessionCookie = async (u: { id: string; session_version: number }) =>
  ({ name: ADMIN_COOKIE, value: await makeToken("a", u.id, u.session_version, ADMIN_DAYS), ...cookieOpts(ADMIN_DAYS) });

export async function currentAdmin(): Promise<AdminUser | null> {
  const t = await readToken("a", (await cookies()).get(ADMIN_COOKIE)?.value);
  if (!t) return null;
  const r = await adminRow("id", t.uid);
  if (!r || !r.active || r.session_version !== t.ver) return null;
  return toAdmin(r);
}

/** Admin sections and which roles may open them. */
export const SECTIONS = {
  dashboard: ["owner", "manager", "staff"],
  reports: ["owner", "manager"],
  orders: ["owner", "manager", "staff"],
  appointments: ["owner", "manager", "staff"],
  messages: ["owner", "manager", "staff"],
  customers: ["owner", "manager", "staff"],
  products: ["owner", "manager", "staff"],
  reviews: ["owner", "manager", "staff"],
  catalog: ["owner", "manager"],
  content: ["owner", "manager"],
  marketing: ["owner", "manager"],
  settings: ["owner", "manager"],
  staff: ["owner"],
  backup: ["owner"],
  activity: ["owner", "manager"],
} as const satisfies Record<string, readonly Role[]>;
export type Section = keyof typeof SECTIONS;
export const can = (role: Role, s: Section) => (SECTIONS[s] as readonly Role[]).includes(role);

/* ---------- customer ---------- */

export const customerSessionCookie = async (u: { id: string; session_version: number }) =>
  ({ name: CUST_COOKIE, value: await makeToken("c", u.id, u.session_version, CUST_DAYS), ...cookieOpts(CUST_DAYS) });

export async function currentCustomer(): Promise<Customer | null> {
  const t = await readToken("c", (await cookies()).get(CUST_COOKIE)?.value);
  if (!t) return null;
  const r = await customerRow("id", t.uid);
  if (!r || !r.active || r.session_version !== t.ver) return null;
  return toCustomer(r);
}

/* ---------- password reset links ---------- */

export async function createResetToken(userType: "admin" | "customer", userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  await (await db()).query(`insert into password_resets (token_hash, user_type, user_id, expires_at) values ($1,$2,$3, now() + interval '1 hour')`, [hash, userType, userId]);
  return token;
}

export async function consumeResetToken(userType: "admin" | "customer", token: string) {
  const hash = crypto.createHash("sha256").update(String(token)).digest("hex");
  const r = await (await db()).query<{ user_id: string }>(
    `update password_resets set used = true where token_hash = $1 and user_type = $2 and used = false and expires_at > now() returning user_id`, [hash, userType]);
  return r[0]?.user_id ?? null;
}

/** For account pages: the signed-in customer, or a redirect to the login page. */
export async function accountUser() {
  const me = await currentCustomer();
  if (!me) (await import("next/navigation")).redirect("/login?next=/account");
  return me!;
}
