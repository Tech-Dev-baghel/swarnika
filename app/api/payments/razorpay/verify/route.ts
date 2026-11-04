import { bad, json, str, withStore } from "@/lib/api";
import { getOrder, setPaymentInfo } from "@/lib/db";
import { confirmRazorpayPayment } from "@/lib/payments";
import { validCheckoutSignature } from "@/lib/razorpay";

/** Called by the checkout page after the Razorpay popup reports success. */
async function _POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const o = await getOrder(str(b.orderId, 60));
  if (!o || o.paymentMethod !== "online") return bad("Order not found", 404);
  const rzpOrderId = str(b.razorpay_order_id, 60), paymentId = str(b.razorpay_payment_id, 60), sig = str(b.razorpay_signature, 200);
  if (rzpOrderId !== o.payment?.rzpOrderId || !validCheckoutSignature(rzpOrderId, paymentId, sig)) return bad("Payment could not be verified. If money was deducted, it will be confirmed automatically or refunded — please contact us with your order number.", 400);
  try {
    const done = await confirmRazorpayPayment(o, paymentId, "checkout");
    return json({ ok: true, id: done.id, status: done.status, paymentStatus: done.paymentStatus, total: done.total });
  } catch (e) {
    await setPaymentInfo(o.id, { lastError: (e as Error).message });
    return bad(`We couldn't confirm the payment yet: ${(e as Error).message}. Please contact us with your order number.`, 409);
  }
}
export const POST = withStore(_POST);
