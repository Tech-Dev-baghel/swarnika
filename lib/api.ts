import "server-only";
import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function guard() {
  return (await isAdmin()) ? null : bad("Not signed in", 401);
}

/** Wraps a route handler so database problems come back as a readable JSON error instead of a crash. */
export function withStore<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A) => {
    try { return await fn(...a); } catch (e) {
      const { StorageError } = await import("./db");
      if (e instanceof StorageError) return bad(e.message, 503);
      console.error(e);
      return bad("Something went wrong on our side. Please try again.", 500);
    }
  };
}
