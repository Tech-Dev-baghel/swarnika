import { revalidatePath } from "next/cache";
import { isResponse, json, requireAdmin, withStore } from "@/lib/api";
import { audit, getRates, getSettings, saveRates, saveSettings } from "@/lib/db";
import type { Rate, Settings } from "@/lib/types";

async function _GET() {
  const me = await requireAdmin("settings"); if (isResponse(me)) return me;
  return json({ settings: await getSettings(), rates: await getRates() });
}
async function _PUT(req: Request) {
  const me = await requireAdmin("settings"); if (isResponse(me)) return me;
  const body = (await req.json()) as { settings?: Partial<Settings>; rates?: Rate[] };
  if (body.settings) {
    const x = body.settings as Record<string, unknown>;
    for (const k of ["codMaxAmount", "codFee", "shippingFee", "freeShippingAbove", "savingsBonusPct"]) if (k in x) x[k] = Math.max(0, Math.round(Number(x[k]) || 0));
    if ("codEnabled" in x) x.codEnabled = Boolean(x.codEnabled);
    if (typeof x.gstin === "string") x.gstin = x.gstin.toUpperCase().replace(/\s/g, "");
    if (typeof x.gstin === "string" && x.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(x.gstin)) return json({ error: "That GSTIN doesn't look right (15 characters, e.g. 27ABCDE1234F1Z5)." }, 400);
    if (typeof x.pickupPincode === "string" && x.pickupPincode && !/^\d{6}$/.test(x.pickupPincode)) return json({ error: "Pickup pincode must be 6 digits." }, 400);
    await saveSettings(body.settings);
  }
  if (body.rates) await saveRates(body.rates);
  await audit(me.email, "Updated settings / gold rates", body.rates ? body.rates.map((r) => `${r.purity}=${r.perGram}`).join(" ") : "");
  revalidatePath("/", "layout");
  return json({ settings: await getSettings(), rates: await getRates() });
}
export const GET = withStore(_GET);
export const PUT = withStore(_PUT);
