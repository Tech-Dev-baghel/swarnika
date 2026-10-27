import "server-only";
import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function guard() {
  return (await isAdmin()) ? null : bad("Not signed in", 401);
}
