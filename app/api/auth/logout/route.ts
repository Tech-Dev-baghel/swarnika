import { NextResponse } from "next/server";
import { CUST_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUST_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
