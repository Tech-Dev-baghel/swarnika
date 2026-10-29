import { isResponse, json, requireCustomer, withStore } from "@/lib/api";
import { db, isPersistent } from "@/lib/db";

/** Replaces the saved wishlist (the browser merges its local list before calling). */
async function _PUT(req: Request) {
  const me = await requireCustomer(); if (isResponse(me)) return me;
  const { ids } = await req.json().catch(() => ({}));
  const list = Array.isArray(ids) ? Array.from(new Set(ids.map(String))).slice(0, 200) : [];
  if (isPersistent()) await (await db()).query(`update customers set wishlist = $2 where id = $1`, [me.id, JSON.stringify(list)]);
  return json({ ids: list });
}
export const PUT = withStore(_PUT);
