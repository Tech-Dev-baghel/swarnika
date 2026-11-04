import "server-only";
import crypto from "crypto";
import type { Order } from "./types";

/**
 * Razorpay (https://razorpay.com/docs/api/). Set in Vercel → Settings → Environment Variables:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET          (Dashboard → Account & Settings → API Keys)
 *   RAZORPAY_WEBHOOK_SECRET                       (Dashboard → Webhooks, optional but recommended)
 * Use the rzp_test_… keys first; switch to rzp_live_… after testing.
 */
const KEY_ID = () => process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = () => process.env.RAZORPAY_KEY_SECRET || "";
const BASE = () => process.env.RAZORPAY_API_BASE || "https://api.razorpay.com/v1";

export const razorpayEnabled = () => Boolean(KEY_ID() && KEY_SECRET());
export const razorpayKeyId = KEY_ID;
export const razorpayTestMode = () => KEY_ID().startsWith("rzp_test_");

export class RazorpayError extends Error {}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const r = await fetch(BASE() + path, {
    method,
    headers: { Authorization: "Basic " + Buffer.from(`${KEY_ID()}:${KEY_SECRET()}`).toString("base64"), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const j = (await r.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!r.ok) throw new RazorpayError(j.error?.description || `Razorpay error ${r.status}`);
  return j;
}

export type RzpOrder = { id: string; amount: number; currency: string; status: string };
export type RzpPayment = { id: string; order_id: string; amount: number; status: "created" | "authorized" | "captured" | "refunded" | "failed"; method?: string; error_description?: string };

/** Amount is in rupees; Razorpay works in paise. */
export const createRzpOrder = (amountRupees: number, receipt: string) =>
  call<RzpOrder>("POST", "/orders", { amount: Math.round(amountRupees * 100), currency: "INR", receipt: receipt.slice(0, 40), notes: { order_id: receipt } });

export const fetchPayment = (id: string) => call<RzpPayment>("GET", `/payments/${encodeURIComponent(id)}`);
export const capturePayment = (id: string, amountPaise: number) => call<RzpPayment>("POST", `/payments/${encodeURIComponent(id)}/capture`, { amount: amountPaise, currency: "INR" });
export const refundPayment = (id: string, amountRupees?: number) =>
  call<{ id: string; amount: number; status: string }>("POST", `/payments/${encodeURIComponent(id)}/refund`, amountRupees ? { amount: Math.round(amountRupees * 100) } : {});

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
/** Checkout success handler signature: HMAC-SHA256(order_id + "|" + payment_id, key secret). */
export const validCheckoutSignature = (rzpOrderId: string, paymentId: string, signature: string) =>
  Boolean(signature) && safeEqual(crypto.createHmac("sha256", KEY_SECRET()).update(`${rzpOrderId}|${paymentId}`).digest("hex"), signature);
/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export const validWebhookSignature = (raw: string, signature: string) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  return Boolean(secret && signature) && safeEqual(crypto.createHmac("sha256", secret).update(raw).digest("hex"), signature);
};

/** What the Razorpay checkout popup needs to take payment for an order. */
export function payParams(o: Order, rzpOrderId: string, brand: string) {
  return {
    key: KEY_ID(), rzpOrderId, amount: o.total * 100, currency: "INR", name: brand, description: `Order ${o.id}`,
    prefill: { name: o.customer.name, email: o.customer.email, contact: o.customer.phone.replace(/\D/g, "").slice(-10) },
  };
}
