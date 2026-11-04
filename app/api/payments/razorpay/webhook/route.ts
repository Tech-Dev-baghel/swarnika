import { db, findOrderByRzp, markRefunded, setPaymentInfo } from "@/lib/db";
import { confirmRazorpayPayment } from "@/lib/payments";
import { validWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay → Webhooks: URL https://<your-site>/api/payments/razorpay/webhook
 * Events: payment.captured, payment.failed, refund.processed. Secret = RAZORPAY_WEBHOOK_SECRET.
 * Catches payments where the customer closed the browser before returning to the site.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "")) return new Response("bad signature", { status: 400 });
  const ev = JSON.parse(raw) as { event: string; payload: { payment?: { entity: { id: string; order_id: string; error_description?: string } }; refund?: { entity: { id: string; payment_id: string; amount: number } } } };
  try {
    if (ev.event === "payment.captured" || ev.event === "order.paid") {
      const p = ev.payload.payment?.entity;
      const o = p && (await findOrderByRzp(p.order_id));
      if (o && p) await confirmRazorpayPayment(o, p.id, "webhook");
    } else if (ev.event === "payment.failed") {
      const p = ev.payload.payment?.entity;
      const o = p && (await findOrderByRzp(p.order_id));
      if (o && p && o.paymentStatus === "pending") await setPaymentInfo(o.id, { lastError: p.error_description || "Payment failed" });
    } else if (ev.event === "refund.processed" || ev.event === "refund.created") {
      const rf = ev.payload.refund?.entity;
      if (rf) {
        const r = await (await db()).query<{ id: string }>(`select id from orders where payment->>'paymentId' = $1`, [rf.payment_id]);
        if (r[0]) await markRefunded(r[0].id, { refundId: rf.id, refundAmount: rf.amount / 100 });
      }
    }
  } catch (e) {
    console.error("[razorpay webhook]", (e as Error).message);
    return new Response("error", { status: 500 }); // Razorpay retries later
  }
  return new Response("ok");
}
