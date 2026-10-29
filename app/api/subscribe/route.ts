import { bad, isEmail, json, normEmail, withStore } from "@/lib/api";
import { addSubscriber } from "@/lib/db";
import { clientIp, limited } from "@/lib/ratelimit";

async function _POST(req: Request) {
  if (limited("sub:" + clientIp(req), 10, 10 * 60 * 1000)) return bad("Too many requests", 429);
  const { email } = await req.json().catch(() => ({}));
  const e = normEmail(email);
  if (!isEmail(e)) return bad("Please enter a valid email");
  await addSubscriber(e);
  return json({ ok: true }, 201);
}
export const POST = withStore(_POST);
