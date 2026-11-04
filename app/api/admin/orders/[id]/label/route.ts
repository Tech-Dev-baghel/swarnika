import { bad, isResponse, requireAdmin, withStore } from "@/lib/api";
import { getOrder } from "@/lib/db";
import { labelPdf } from "@/lib/dtdc";

/** DTDC 4×6 shipping label PDF for printing. */
async function _GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin("orders"); if (isResponse(me)) return me;
  const o = await getOrder((await ctx.params).id);
  if (!o?.shipment || o.shipment.carrier !== "dtdc") return bad("No DTDC shipment on this order", 404);
  const pdf = await labelPdf(o.shipment.awb);
  return new Response(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="label-${o.shipment.awb}.pdf"` } });
}
export const GET = withStore(_GET);
