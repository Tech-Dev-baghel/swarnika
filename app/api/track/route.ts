import { bad, json, withStore } from "@/lib/api";
import { getDB } from "@/lib/db";
import { clientIp, limited } from "@/lib/ratelimit";

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

async function _POST(req: Request) {
  if (limited("track:" + clientIp(req), 20, 10 * 60 * 1000)) return bad("Too many attempts, please try again later.", 429);
  const { id, phone } = await req.json().catch(() => ({}));
  const db = await getDB();
  const o = db.orders.find((x) => x.id.toUpperCase() === String(id ?? "").trim().toUpperCase());
  if (!o || digits(o.customer.phone) !== digits(String(phone ?? ""))) return bad("We couldn't find an order with that number and phone.", 404);
  return json({ id: o.id, createdAt: o.createdAt, status: o.status, total: o.total, items: o.items.map((i) => ({ name: i.name, qty: i.qty, image: i.image })), city: o.customer.city });
}

export const POST = withStore(_POST);
