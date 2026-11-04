import { bad, json, withStore } from "@/lib/api";
import { blockedPins, pincodeInfo } from "@/lib/checkout";
import { getSettings } from "@/lib/db";
import { clientIp, limited } from "@/lib/ratelimit";

/** GET /api/pincode?pin=400050 → city, state, whether we deliver there and whether COD works. */
async function _GET(req: Request) {
  if (limited("pin:" + clientIp(req), 60, 10 * 60 * 1000)) return bad("Too many checks, please try again in a few minutes.", 429);
  const pin = (new URL(req.url).searchParams.get("pin") ?? "").replace(/\D/g, "");
  const s = await getSettings();
  const info = await pincodeInfo(pin, s);
  const cod = !s.codEnabled || blockedPins(s).has(pin) ? false : info.cod;
  return json({ ...info, cod, days: s.deliveryDays, codMaxAmount: s.codMaxAmount }, 200);
}
export const GET = withStore(_GET);
