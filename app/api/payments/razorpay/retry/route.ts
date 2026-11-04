import { bad, json, str, withStore } from "@/lib/api";
import { currentCustomer } from "@/lib/auth";
import { getOrder, getSettings, setPaymentInfo } from "@/lib/db";
import { clientIp, limited } from "@/lib/ratelimit";
import { createRzpOrder, payParams, razorpayEnabled } from "@/lib/razorpay";

const digits = (s: string) => s.replace(/\D/g, "").slice(-10);

/** "Pay now" for an online order that wasn't paid yet (popup closed, payment failed…). */
async function _POST(req: Request) {
  if (limited("payretry:" + clientIp(req), 20, 10 * 60 * 1000)) return bad("Too many attempts, please try again later.", 429);
  if (!razorpayEnabled()) return bad("Online payment isn't available right now.", 503);
  const b = await req.json().catch(() => ({}));
  const o = await getOrder(str(b.orderId, 60).toUpperCase());
  const me = await currentCustomer();
  const owner = o && ((me && o.customerId === me.id) || (b.phone && digits(String(b.phone)) === digits(o.customer.phone)));
  if (!o || !owner) return bad("Order not found", 404);
  if (o.paymentStatus === "paid") return bad("This order is already paid.", 409);
  if (o.paymentMethod !== "online" || o.paymentStatus !== "pending" || o.status !== "new") return bad("This order can no longer be paid online — it may have expired. Please place it again or contact us.", 409);
  let rzpOrderId = o.payment?.rzpOrderId;
  if (!rzpOrderId) { rzpOrderId = (await createRzpOrder(o.total, o.id)).id; await setPaymentInfo(o.id, { gateway: "razorpay", rzpOrderId }); }
  const s = await getSettings();
  return json({ id: o.id, total: o.total, pay: payParams(o, rzpOrderId, s.brandName) });
}
export const POST = withStore(_POST);
