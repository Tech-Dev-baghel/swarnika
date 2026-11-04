"use client";

export type PayParams = { key: string; rzpOrderId: string; amount: number; currency: string; name: string; description: string; prefill: { name: string; email: string; contact: string } };
type RzpResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RzpCtor = new (o: Record<string, unknown>) => { open: () => void; on: (ev: string, fn: (r: { error?: { description?: string } }) => void) => void };

let loading: Promise<void> | null = null;
function loadScript() {
  if ((window as unknown as { Razorpay?: RzpCtor }).Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => { loading = null; reject(new Error("Couldn't load the payment window. Check your internet connection.")); };
    document.body.appendChild(s);
  });
  return loading;
}

export type PayResult = { ok: true } | { ok: false; reason: "closed" | "failed" | "error"; message: string };

/** Opens Razorpay for an order and verifies the payment with our server. */
export async function payWithRazorpay(orderId: string, pay: PayParams, theme = "#7a2a38"): Promise<PayResult> {
  try { await loadScript(); } catch (e) { return { ok: false, reason: "error", message: (e as Error).message }; }
  const Rzp = (window as unknown as { Razorpay: RzpCtor }).Razorpay;
  return new Promise<PayResult>((resolve) => {
    let settled = false;
    const done = (r: PayResult) => { if (!settled) { settled = true; resolve(r); } };
    const rzp = new Rzp({
      key: pay.key, order_id: pay.rzpOrderId, amount: pay.amount, currency: pay.currency, name: pay.name, description: pay.description,
      prefill: pay.prefill, notes: { order_id: orderId }, theme: { color: theme },
      handler: async (r: RzpResponse) => {
        const v = await fetch("/api/payments/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, ...r }) });
        const j = await v.json().catch(() => ({}));
        done(v.ok ? { ok: true } : { ok: false, reason: "error", message: j.error ?? "We couldn't confirm the payment." });
      },
      modal: { ondismiss: () => done({ ok: false, reason: "closed", message: "Payment was not completed." }) },
    });
    rzp.on("payment.failed", (r) => done({ ok: false, reason: "failed", message: r.error?.description || "The payment failed." }));
    rzp.open();
  });
}

/** For an order that wasn't paid yet: gets fresh payment details and opens Razorpay again. */
export async function retryPayment(orderId: string, phone?: string): Promise<PayResult> {
  const r = await fetch("/api/payments/razorpay/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, phone }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, reason: "error", message: j.error ?? "Couldn't start the payment." };
  return payWithRazorpay(orderId, j.pay);
}
