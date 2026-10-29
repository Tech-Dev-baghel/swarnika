import "server-only";
import { NextResponse } from "next/server";
import { can, currentAdmin, currentCustomer, type Section } from "./auth";
import { StorageError } from "./db";
import type { AdminUser, Customer } from "./types";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

/** Returns the signed-in staff member if they may use `section`, otherwise a 401/403 response. */
export async function requireAdmin(section: Section): Promise<AdminUser | Response> {
  const a = await currentAdmin();
  if (!a) return bad("Please sign in again", 401);
  if (!can(a.role, section)) return bad("Your role doesn't have access to this section", 403);
  return a;
}
export async function requireCustomer(): Promise<Customer | Response> {
  return (await currentCustomer()) ?? bad("Please log in", 401);
}
export const isResponse = (x: unknown): x is Response => x instanceof Response;

/** Wraps a route handler so database problems come back as a readable JSON error instead of a crash. */
export function withStore<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A) => {
    try { return await fn(...a); } catch (e) {
      if (e instanceof StorageError) return bad(e.message, 503);
      const code = (e as { code?: string }).code;
      if (code === "23505") return bad("That already exists (duplicate email, phone or code).", 409);
      console.error(e);
      return bad("Something went wrong on our side. Please try again.", 500);
    }
  };
}

export const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
export const normEmail = (v: unknown) => str(v, 120).toLowerCase();
export const normPhone = (v: unknown) => { const d = String(v ?? "").replace(/\D/g, ""); return d.length >= 10 ? d.slice(-10) : ""; };
export const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
