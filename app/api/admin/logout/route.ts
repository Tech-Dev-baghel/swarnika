import { withStore } from "@/lib/api";
import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";

async function _POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export const POST = withStore(_POST);
