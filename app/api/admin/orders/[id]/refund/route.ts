import { revalidatePath } from "next/cache";
import { bad, isResponse, json, requireAdmin, withStore } from "@/lib/api";
import { audit, getOrder, markRefunded } from "@/lib/db";
import { refundPayment } from "@/lib/razorpay";

/** Full or partial refund of an online payment through Razorpay (owners and managers only). */
async function _POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin("orders"); if (isResponse(me)) return me;
  if (me.role === "staff") return bad("Only the owner or a manager can refund payments.", 403);
  const o = await getOrder((await ctx.params).id);
  if (!o) return bad("Order not found", 404);
  if (o.paymentStatus !== "paid" || !o.payment?.paymentId) return bad("Only paid online orders can be refunded here.");
  const b = await req.json().catch(() => ({}));
  const amount = b.amount ? Math.round(Number(b.amount)) : o.total;
  if (!(amount > 0 && amount <= o.total)) return bad(`Refund must be between ₹1 and ₹${o.total}.`);
  const rf = await refundPayment(o.payment.paymentId, amount);
  const next = await markRefunded(o.id, { refundId: rf.id, refundAmount: amount });
  await audit(me.email, `Refunded ${o.id}`, `₹${amount} · ${rf.id}`);
  revalidatePath("/", "layout");
  return json(next);
}
export const POST = withStore(_POST);
