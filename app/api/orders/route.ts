import { revalidatePath } from "next/cache";
import { bad, json, withStore } from "@/lib/api";
import { applyCoupon } from "@/lib/coupons";
import { getDB, mutate, newId } from "@/lib/db";
import { orderEmails } from "@/lib/mail";
import { clientIp, limited } from "@/lib/ratelimit";
import { priceOf } from "@/lib/pricing";
import type { Order } from "@/lib/types";

const s = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

async function _POST(req: Request) {
  if (limited("order:" + clientIp(req), 15, 10 * 60 * 1000)) return bad("Too many orders from this connection. Please call us instead.", 429);
  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid request");
  const c = body.customer ?? {};
  const customer = { name: s(c.name, 80), phone: s(c.phone, 20), email: s(c.email, 120), address: s(c.address, 300), city: s(c.city, 60), pincode: s(c.pincode, 6) };
  if (!customer.name || !/^[0-9+\- ]{10,15}$/.test(customer.phone) || !customer.address || !/^\d{6}$/.test(customer.pincode)) {
    return bad("Please fill your name, a valid phone number, address and 6-digit pincode.");
  }
  const lines: { id: string; qty: number; size?: string }[] = Array.isArray(body.items) ? body.items : [];
  if (!lines.length) return bad("Your bag is empty");

  const result = await mutate((db) => {
    const items: Order["items"] = [];
    for (const l of lines) {
      const p = db.products.find((x) => x.id === l.id && x.active);
      if (!p) continue;
      const qty = Math.max(1, Math.min(10, Number(l.qty) || 1));
      items.push({ id: p.id, name: p.name, qty, size: l.size ? s(l.size, 10) : undefined, price: priceOf(p, db.rates), image: p.images[0] });
      p.stock = Math.max(0, (p.stock ?? 0) - qty);
    }
    if (!items.length) return null;
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const { discount, coupon } = applyCoupon(db.coupons, body.coupon, subtotal);
    const order: Order = { id: newId("ORD").toUpperCase(), createdAt: new Date().toISOString(), customer, items, subtotal, discount, coupon: coupon?.code, total: subtotal - discount, status: "new" };
    db.orders.unshift(order);
    return order;
  });
  if (!result) return bad("Those items are no longer available");
  const { settings } = await getDB();
  orderEmails(result, settings.brandName, settings.email);
  revalidatePath("/", "layout");
  return json({ id: result.id, total: result.total }, 201);
}

export const POST = withStore(_POST);
