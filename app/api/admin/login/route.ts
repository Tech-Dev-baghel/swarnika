import { NextResponse } from "next/server";
import { checkPassword, COOKIE, cookieOptions, makeToken } from "@/lib/auth";
import { clear, clientIp, record, tooMany } from "@/lib/ratelimit";

const WINDOW = 10 * 60 * 1000;

export async function POST(req: Request) {
  const key = "login:" + clientIp(req);
  if (tooMany(key, 8, WINDOW)) {
    return NextResponse.json({ error: "Too many wrong attempts. Please wait 10 minutes and try again." }, { status: 429 });
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!checkPassword(String(password ?? ""))) {
    record(key);
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  clear(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), cookieOptions);
  return res;
}
