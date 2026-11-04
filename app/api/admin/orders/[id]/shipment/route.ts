import { revalidatePath } from "next/cache";
import { bad, isResponse, json, requireAdmin, str, withStore } from "@/lib/api";
import { audit, getOrder, getSettings, setShipment } from "@/lib/db";
import { cancelShipment, createShipment, dtdcEnabled } from "@/lib/dtdc";
import { shippedEmail } from "@/lib/mail";
import { refreshTracking } from "@/lib/shipping";

type Ctx = { params: Promise<{ id: string }> };

/** Book DTDC, add a manual AWB, refresh tracking or cancel the shipment. */
async function _POST(req: Request, ctx: Ctx) {
  const me = await requireAdmin("orders"); if (isResponse(me)) return me;
  const o = await getOrder((await ctx.params).id);
  if (!o) return bad("Order not found", 404);
  const b = await req.json().catch(() => ({}));
  const action = String(b.action ?? "");

  if (action === "create") {
    if (!dtdcEnabled()) return bad("DTDC isn't set up yet — add the DTDC keys in Vercel, or use “Add tracking number” for a shipment you booked yourself.");
    if (o.status === "cancelled") return bad("This order is cancelled.");
    if (o.paymentMethod === "online" && o.paymentStatus !== "paid") return bad("This online order isn't paid yet — don't ship it.");
    if (o.shipment && !o.shipment.cancelled) return bad("This order already has a shipment. Cancel it first to book again.");
    const weightKg = Math.min(50, Math.max(0.1, Number(b.weightKg) || 0.5));
    const codAmount = o.paymentStatus === "cod" ? o.total : 0;
    const s = await getSettings();
    const { awb } = await createShipment(o, s, {
      weightKg, lengthCm: Number(b.lengthCm) || undefined, widthCm: Number(b.widthCm) || undefined, heightCm: Number(b.heightCm) || undefined,
      declaredValue: o.total, codAmount, description: str(b.description, 100) || "Jewellery",
    });
    const next = await setShipment(o.id, { carrier: "dtdc", awb, createdAt: new Date().toISOString(), status: "Booked", weightKg, codAmount, events: [] }, o.status === "new" ? "confirmed" : o.status);
    await audit(me.email, `Booked DTDC for ${o.id}`, `AWB ${awb}${codAmount ? ` · COD ₹${codAmount}` : ""}`);
    revalidatePath("/", "layout");
    return json(next);
  }
  if (action === "manual") {
    const awb = str(b.awb, 40), carrierName = str(b.carrierName, 40) || "Courier";
    if (!awb) return bad("Enter the tracking (AWB) number.");
    const next = await setShipment(o.id, { carrier: /^dtdc$/i.test(carrierName) ? "dtdc" : "other", carrierName, awb, createdAt: new Date().toISOString(), status: "Shipped", events: [] }, o.status === "delivered" ? "delivered" : "shipped");
    if (next) shippedEmail(next);
    await audit(me.email, `Added tracking for ${o.id}`, `${carrierName} ${awb}`);
    revalidatePath("/", "layout");
    return json(next);
  }
  if (action === "refresh") {
    if (!o.shipment) return bad("No shipment on this order.");
    return json(await refreshTracking(o));
  }
  if (action === "cancel") {
    if (!o.shipment) return bad("No shipment on this order.");
    if (o.shipment.carrier === "dtdc" && dtdcEnabled()) await cancelShipment(o.shipment.awb);
    const next = await setShipment(o.id, null, o.status === "shipped" ? "confirmed" : o.status);
    await audit(me.email, `Cancelled shipment for ${o.id}`, o.shipment.awb);
    revalidatePath("/", "layout");
    return json(next);
  }
  return bad("Unknown action");
}
export const POST = withStore(_POST);
