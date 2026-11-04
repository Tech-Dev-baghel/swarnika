import "server-only";
import { dtdcTrackingEnabled, track } from "./dtdc";
import { setShipment } from "./db";
import { shippedEmail } from "./mail";
import type { Order, OrderStatus } from "./types";

/** Pulls the latest DTDC events and moves the order to shipped/delivered. `maxAgeMin` throttles customer page views. */
export async function refreshTracking(o: Order, maxAgeMin = 0): Promise<Order> {
  const sh = o.shipment;
  if (!sh || sh.carrier !== "dtdc" || sh.cancelled || !dtdcTrackingEnabled()) return o;
  if (o.status === "delivered" || o.status === "cancelled") return o;
  if (maxAgeMin && sh.checkedAt && Date.now() - new Date(sh.checkedAt).getTime() < maxAgeMin * 60_000) return o;
  const t = await track(sh.awb);
  const moving = t.events.some((e) => /pick|in ?transit|dispatch|out for|arrived|received/i.test(e.status));
  let status: OrderStatus = o.status;
  if (t.delivered) status = "delivered";
  else if (moving && (o.status === "new" || o.status === "confirmed")) status = "shipped";
  const next = await setShipment(o.id, { ...sh, status: t.status, events: t.events.slice(0, 40), checkedAt: new Date().toISOString() }, status);
  if (next && status === "shipped" && o.status !== "shipped") shippedEmail(next);
  return next ?? o;
}
