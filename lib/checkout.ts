import "server-only";
import { dtdcEnabled, serviceability } from "./dtdc";
import { findState } from "./india";
import type { Settings } from "./types";

export type PinInfo = {
  pincode: string; valid: boolean; city?: string; state?: string;
  deliverable: boolean | null; cod: boolean | null; source: string[];
};

const cache = new Map<string, { v: PinInfo; exp: number }>();

/** Looks up a pincode: India Post for city/state (free), DTDC for delivery + COD when DTDC is set up. */
export async function pincodeInfo(pin: string, s: Settings): Promise<PinInfo> {
  if (!/^[1-9]\d{5}$/.test(pin)) return { pincode: pin, valid: false, deliverable: false, cod: false, source: [] };
  const hit = cache.get(pin);
  if (hit && hit.exp > Date.now()) return hit.v;
  const out: PinInfo = { pincode: pin, valid: true, deliverable: null, cod: null, source: [] };
  const [post, dt] = await Promise.allSettled([
    fetch(`${process.env.POSTAL_API_BASE || "https://api.postalpincode.in"}/pincode/${pin}`, { signal: AbortSignal.timeout(4000), cache: "no-store" }).then((r) => r.json()),
    dtdcEnabled() && s.pickupPincode ? serviceability(s.pickupPincode, pin) : Promise.resolve(null),
  ]);
  if (post.status === "fulfilled") {
    const p = (post.value as { Status?: string; PostOffice?: { District?: string; State?: string }[] }[])?.[0];
    if (p?.Status === "Success" && p.PostOffice?.length) {
      out.city = p.PostOffice[0].District; out.state = findState(p.PostOffice[0].State)?.name ?? p.PostOffice[0].State; out.source.push("indiapost");
    } else if (p?.Status === "Error") { out.valid = false; out.deliverable = false; }
  }
  if (dt.status === "fulfilled" && dt.value) {
    out.source.push("dtdc");
    if (dt.value.serviceable !== null) out.deliverable = dt.value.serviceable;
    if (dt.value.cod !== null) out.cod = dt.value.cod;
  }
  cache.set(pin, { v: out, exp: Date.now() + 6 * 3600 * 1000 });
  if (cache.size > 3000) cache.clear();
  return out;
}

export const blockedPins = (s: Settings) => new Set(String(s.codBlockedPincodes || "").split(/[\s,]+/).filter((x) => /^\d{6}$/.test(x)));

/** Shipping and COD rules for a bag total (after discount) and destination. */
export function checkoutRules(s: Settings, totalAfterDiscount: number, pin?: PinInfo | null) {
  const shippingFee = s.shippingFee > 0 && !(s.freeShippingAbove > 0 && totalAfterDiscount >= s.freeShippingAbove) ? Math.round(s.shippingFee) : 0;
  let codReason = "";
  if (!s.codEnabled) codReason = "Cash on delivery is not available right now.";
  else if (s.codMaxAmount > 0 && totalAfterDiscount > s.codMaxAmount) codReason = `Cash on delivery is available on orders up to ₹${s.codMaxAmount.toLocaleString("en-IN")}. Please pay online for this order.`;
  else if (pin && blockedPins(s).has(pin.pincode)) codReason = "Cash on delivery is not available for this pincode.";
  else if (pin && pin.cod === false) codReason = "Our courier does not collect cash at this pincode. Please pay online.";
  return { shippingFee, codAllowed: !codReason, codReason, codFee: Math.max(0, Math.round(s.codFee || 0)) };
}
