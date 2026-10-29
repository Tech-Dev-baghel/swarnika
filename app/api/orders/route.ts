import { revalidatePath } from "next/cache";
import { bad, json, str, withStore } from "@/lib/api";
import { currentCustomer } from "@/lib/auth";
import { createOrder, db, getSettings, newId } from "@/lib/db";
import { orderEmails } from "@/lib/mail";
import { clientIp, limited } from "@/lib/ratelimit";
import type { Address } from "@/lib/types";

async function _POST(req: Request) {
  if (limited("order:" + clientIp(req), 15, 10 * 60 * 1000)) return bad("Too many orders from this connection. Please call us instead.", 429);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid request");
  const c = body.customer ?? {};
  const customer = { name: str(c.name, 80), phone: str(c.phone, 20), email: str(c.email, 120), address: str(c.address, 300), city: str(c.city, 60), pincode: str(c.pincode, 6) };
  if (!customer.name || !/^[0-9+\- ]{10,16}$/.test(customer.phone) || !customer.address || !/^\d{6}$/.test(customer.pincode)) {
    return bad("Please fill your name, a valid phone number, address and 6-digit pincode.");
  }
  const lines = Array.isArray(body.items) ? body.items.slice(0, 50).map((l: Record<string, unknown>) => ({ id: str(l.id, 40), qty: Number(l.qty) || 1, size: l.size ? str(l.size, 10) : undefined })) : [];
  if (!lines.length) return bad("Your bag is empty");
  const me = await currentCustomer();
  const order = await createOrder({ customer, lines, coupon: body.coupon ? str(body.coupon, 30) : undefined, customerId: me?.id ?? null });
  if (!order) return bad("Those items are no longer available");
  // Logged-in customers can save this address for next time.
  if (me && body.saveAddress && !me.addresses.some((a) => a.address === customer.address && a.pincode === customer.pincode)) {
    const addr: Address = { id: newId("adr"), label: "Home", name: customer.name, phone: customer.phone, address: customer.address, city: customer.city, pincode: customer.pincode, isDefault: me.addresses.length === 0 };
    await (await db()).query(`update customers set addresses = $2 where id = $1`, [me.id, JSON.stringify([...me.addresses, addr])]);
  }
  const s = await getSettings();
  orderEmails(order, s.brandName, s.email);
  revalidatePath("/", "layout");
  return json({ id: order.id, total: order.total }, 201);
}
export const POST = withStore(_POST);
