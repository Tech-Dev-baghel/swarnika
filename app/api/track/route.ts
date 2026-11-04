import { bad, json, withStore } from "@/lib/api";
import { getOrder } from "@/lib/db";
import { clientIp, limited } from "@/lib/ratelimit";
import { refreshTracking } from "@/lib/shipping";

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

async function _POST(req: Request) {
  if (limited("track:" + clientIp(req), 20, 10 * 60 * 1000)) return bad("Too many attempts, please try again later.", 429);
  const { id, phone } = await req.json().catch(() => ({}));
  let o = await getOrder(String(id ?? "").trim().toUpperCase());
  if (!o || digits(o.customer.phone) !== digits(String(phone ?? ""))) return bad("We couldn't find an order with that number and phone.", 404);
  o = await refreshTracking(o, 30).catch(() => o!);
  const sh = o.shipment && !o.shipment.cancelled ? o.shipment : null;
  return json({
    id: o.id, createdAt: o.createdAt, status: o.status, total: o.total, city: o.customer.city,
    paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
    items: o.items.map((i) => ({ name: i.name, qty: i.qty, image: i.image })),
    shipment: sh && { carrier: sh.carrier === "dtdc" ? "DTDC" : sh.carrierName ?? "Courier", awb: sh.awb, status: sh.status, events: sh.events.slice(0, 15) },
  });
}
export const POST = withStore(_POST);
