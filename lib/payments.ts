import "server-only";
import { revalidatePath } from "next/cache";
import { audit, getSettings, markPaid } from "./db";
import { orderEmails } from "./mail";
import { capturePayment, fetchPayment } from "./razorpay";
import type { Order } from "./types";

/**
 * Confirms a Razorpay payment for an order against Razorpay itself (amount + status),
 * captures it if the account uses manual capture, then marks the order paid. Safe to call twice.
 */
export async function confirmRazorpayPayment(o: Order, paymentId: string, via: string) {
  const p = await fetchPayment(paymentId);
  if (p.order_id !== o.payment?.rzpOrderId) throw new Error("Payment does not belong to this order");
  if (p.amount !== o.total * 100) throw new Error(`Paid amount ₹${p.amount / 100} does not match order total ₹${o.total}`);
  let status = p.status;
  if (status === "authorized") status = (await capturePayment(p.id, p.amount)).status;
  if (status !== "captured") throw new Error(`Payment is ${status}, not captured`);
  const r = await markPaid(o.id, { gateway: "razorpay", paymentId: p.id, method: p.method });
  if (r?.changed) {
    const s = await getSettings();
    orderEmails(r.order, s.brandName, s.email);
    await audit(`razorpay:${via}`, `Payment received for ${o.id}`, `${p.id} · ₹${o.total}`);
    revalidatePath("/", "layout");
  }
  return r?.order ?? o;
}
