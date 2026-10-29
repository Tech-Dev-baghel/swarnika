import { isResponse, json, requireAdmin, withStore } from "@/lib/api";
import { deleteSubscriber } from "@/lib/db";

async function _DELETE(req: Request) {
  const me = await requireAdmin("marketing"); if (isResponse(me)) return me;
  await deleteSubscriber(new URL(req.url).searchParams.get("id") ?? "");
  return json({ ok: true });
}
export const DELETE = withStore(_DELETE);
