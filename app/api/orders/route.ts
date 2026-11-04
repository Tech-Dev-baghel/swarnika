import { revalidatePath } from "next/cache";
import { bad, json, str, withStore } from "@/lib/api";
import { currentCustomer } from "@/lib/auth";
import { checkoutRules, pincodeInfo } from "@/lib/checkout";
import { createOrder, db, getSettings, newId, setPaymentInfo, updateOrder } from "@/lib/db";
import { findState } from "@/lib/india";
import { orderEmails } from "@/lib/mail";
import { clientIp, limited } from "@/lib/ratelimit";
import { createRzpOrder, payParams, razorpayEnabled } from "@/lib/razorpay";
import type { Address, Order } from "@/lib/types";

async function _POST(req: Request) {
  if (limited("order:" + clientIp(req), 15, 10 * 60 * 1000)) return bad("Too many orders from this connection. Please call us instead.", 429);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return bad("Invalid request");
  const c = body.customer ?? {};
  const customer: Order["customer"] = {
    name: str(c.name, 80), phone: str(c.phone, 20), email: str(c.email, 120), address: str(c.address, 300), city: str(c.city, 60), pincode: str(c.pincode, 6),
    state: findState(str(c.state, 60))?.name ?? "", gstin: str(c.gstin, 15).toUpperCase() || undefined,
  };
  if (!customer.name || !/^[0-9+\- ]{10,16}$/.test(customer.phone) || !customer.address || !/^\d{6}$/.test(customer.pincode)) {
    return bad("Please fill your name, a valid phone number, address and 6-digit pincode.");
  }
  if (customer.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(customer.gstin)) return bad("That GSTIN doesn't look right (15 characters, e.g. 27ABCDE1234F1Z5).");
  const method = body.paymentMethod === "online" ? "online" : "cod";
  if (method === "online" && !razorpayEnabled()) return bad("Online payment isn't available right now. Please choose cash on delivery.");
  const lines = Array.isArray(body.items) ? body.items.slice(0, 50).map((l: Record<string, unknown>) => ({ id: str(l.id, 40), qty: Number(l.qty) || 1, size: l.size ? str(l.size, 10) : undefined })) : [];
  if (!lines.length) return bad("Your bag is empty");

  const s = await getSettings();
  const pin = await pincodeInfo(customer.pincode, s).catch(() => null);
  if (pin && !pin.valid) return bad("That pincode doesn't exist. Please check it.");
  if (pin?.deliverable === false) return bad("Sorry, our courier doesn't deliver to this pincode yet. Please call us and we'll arrange it.");
  if (!customer.state && pin?.state) customer.state = pin.state;
  if (!customer.state) return bad("Please choose your state.");

  const me = await currentCustomer();
  const order = await createOrder({
    customer, lines, coupon: body.coupon ? str(body.coupon, 30) : undefined, customerId: me?.id ?? null, paymentMethod: method, sellerState: s.gstState,
    fees: (after, m) => { const r = checkoutRules(s, after, pin); return { shippingFee: r.shippingFee, codFee: r.codFee, error: m === "cod" && !r.codAllowed ? r.codReason : undefined }; },
  });
  if (!order) return bad("Those items are no longer available");

  // Logged-in customers can save this address for next time.
  if (me && body.saveAddress && !me.addresses.some((a) => a.address === customer.address && a.pincode === customer.pincode)) {
    const addr: Address = { id: newId("adr"), label: "Home", name: customer.name, phone: customer.phone, address: customer.address, city: customer.city, pincode: customer.pincode, state: customer.state, isDefault: me.addresses.length === 0 };
    await (await db()).query(`update customers set addresses = $2 where id = $1`, [me.id, JSON.stringify([...me.addresses, addr])]);
  }
  revalidatePath("/", "layout");

  if (method === "online") {
    try {
      const rz = await createRzpOrder(order.total, order.id);
      await setPaymentInfo(order.id, { gateway: "razorpay", rzpOrderId: rz.id });
      return json({ id: order.id, total: order.total, pay: payParams(order, rz.id, s.brandName) }, 201);
    } catch (e) {
      await updateOrder(order.id, { status: "cancelled", notes: "Payment gateway unavailable" });
      return bad(`Online payment couldn't start (${(e as Error).message}). Please try again or choose cash on delivery.`, 502);
    }
  }
  orderEmails(order, s.brandName, s.email);
  return json({ id: order.id, total: order.total }, 201);
}
export const POST = withStore(_POST);
