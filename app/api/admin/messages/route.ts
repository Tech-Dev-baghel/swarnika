import { bad, isResponse, json, requireAdmin, str, withStore } from "@/lib/api";
import { deleteMessage, setMessageStatus } from "@/lib/db";

async function _PUT(req: Request) {
  const me = await requireAdmin("messages"); if (isResponse(me)) return me;
  const b = await req.json().catch(() => ({}));
  if (!["new", "read", "replied", "closed"].includes(b.status)) return bad("Unknown status");
  await setMessageStatus(str(b.id, 60), b.status);
  return json({ ok: true });
}
async function _DELETE(req: Request) {
  const me = await requireAdmin("messages"); if (isResponse(me)) return me;
  await deleteMessage(new URL(req.url).searchParams.get("id") ?? "");
  return json({ ok: true });
}
export const PUT = withStore(_PUT);
export const DELETE = withStore(_DELETE);
