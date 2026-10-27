import { bad, json, withStore } from "@/lib/api";
import { mutate, newId } from "@/lib/db";
import { clientIp, limited } from "@/lib/ratelimit";

async function _POST(req: Request) {
  if (limited("sub:" + clientIp(req), 10, 10 * 60 * 1000)) return bad("Too many requests", 429);
  const { email } = await req.json().catch(() => ({}));
  const e = String(email ?? "").trim().toLowerCase().slice(0, 120);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return bad("Please enter a valid email");
  await mutate((db) => { if (!db.subscribers.some((x) => x.email === e)) db.subscribers.unshift({ id: newId("sub"), email: e, createdAt: new Date().toISOString() }); });
  return json({ ok: true }, 201);
}

export const POST = withStore(_POST);
