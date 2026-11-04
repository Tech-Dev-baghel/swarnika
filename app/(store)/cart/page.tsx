"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import Photo from "@/components/Photo";
import { CloseIcon, ShieldIcon } from "@/components/Icons";
import { useData } from "@/lib/data-context";
import { STATES } from "@/lib/india";
import { inr } from "@/lib/pricing";
import { payWithRazorpay, retryPayment, type PayParams } from "@/lib/razorpay-client";
import { MAX_QTY, useStore } from "@/lib/store";
import type { Address } from "@/lib/types";

type Customer = { name: string; phone: string; email: string; address: string; city: string; pincode: string; state: string; gstin: string };
type Pin = { pincode: string; valid: boolean; city?: string; state?: string; deliverable: boolean | null; cod: boolean | null; days?: string };

export default function CartPage() {
  const { cart, setQty, removeFromCart, clearCart, customer } = useStore();
  const [saved, setSaved] = useState<Address[]>([]);
  const [saveAddr, setSaveAddr] = useState(true);
  const { getProduct, price, settings: st, features } = useData();
  const online = Boolean(features?.online);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; label: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [step, setStep] = useState<"bag" | "details" | "done">("bag");
  const [c, setC] = useState<Customer>({ name: "", phone: "", email: "", address: "", city: "", pincode: "", state: "", gstin: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; total: number; paid: boolean } | null>(null);
  const [unpaid, setUnpaid] = useState<{ id: string; total: number; msg: string } | null>(null);
  const [method, setMethod] = useState<"online" | "cod">(online ? "online" : "cod");
  const [pin, setPin] = useState<Pin | null>(null);
  const [showGst, setShowGst] = useState(false);

  const lines = cart.map((l) => ({ ...l, p: getProduct(l.id)! })).filter((l) => l.p);
  const subtotal = lines.reduce((n, l) => n + price(l.p) * l.qty, 0);
  const [discount, setDiscount] = useState(0);

  // Signed-in customers: pre-fill the delivery form from their account.
  useEffect(() => {
    if (step !== "details" || !customer) return;
    fetch("/api/account").then((r) => (r.ok ? r.json() : null)).then((me) => {
      if (!me) return;
      setSaved(me.addresses ?? []);
      const d: Address | undefined = (me.addresses ?? []).find((a: Address) => a.isDefault) ?? me.addresses?.[0];
      setC((cur) => (cur.name || cur.address ? cur : {
        name: d?.name ?? me.name, phone: d?.phone ?? me.phone ?? "", email: me.email ?? "", address: d?.address ?? "", city: d?.city ?? "", pincode: d?.pincode ?? "", state: d?.state ?? "", gstin: "",
      }));
    }).catch(() => {});
  }, [step, customer]);

  // Re-check the coupon whenever the bag total changes (percent coupons depend on it).
  useEffect(() => {
    if (!applied) return;
    let live = true;
    fetch("/api/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: applied.code, subtotal }) })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => { if (!live) return; if (ok) setDiscount(j.discount); else { setApplied(null); setDiscount(0); setMsg(j.error); } })
      .catch(() => {});
    return () => { live = false; };
  }, [subtotal, applied]);

  // Look up the pincode as soon as 6 digits are typed: fills city/state and tells us if COD works there.
  useEffect(() => {
    if (!/^\d{6}$/.test(c.pincode)) { setPin(null); return; }
    let live = true;
    fetch(`/api/pincode?pin=${c.pincode}`).then((r) => (r.ok ? r.json() : null)).then((j: Pin | null) => {
      if (!live || !j) return;
      setPin(j);
      if (j.valid) setC((cur) => ({ ...cur, city: cur.city || j.city || "", state: cur.state || j.state || "" }));
    }).catch(() => {});
    return () => { live = false; };
  }, [c.pincode]);

  const afterDiscount = subtotal - Math.min(discount, subtotal);
  const shippingFee = st.shippingFee > 0 && !(st.freeShippingAbove > 0 && afterDiscount >= st.freeShippingAbove) ? st.shippingFee : 0;
  const blocked = String(st.codBlockedPincodes || "").split(/[\s,]+/).includes(c.pincode);
  const codReason = !st.codEnabled ? "Cash on delivery is not available right now."
    : st.codMaxAmount > 0 && afterDiscount > st.codMaxAmount ? `Cash on delivery is available up to ${inr(st.codMaxAmount)}. Please pay online.`
    : blocked || pin?.cod === false ? "Cash on delivery isn't available at this pincode. Please pay online." : "";
  const codOk = !codReason;
  const pay = !codOk && online ? "online" : method;
  const codFee = pay === "cod" ? Math.max(0, st.codFee || 0) : 0;
  const grand = afterDiscount + shippingFee + codFee;

  const applyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotal }) });
    const j = await r.json();
    if (r.ok) { setApplied({ code: j.code, label: j.label }); setDiscount(j.discount); setMsg(`${j.code} applied — ${j.label}`); }
    else { setApplied(null); setDiscount(0); setMsg(j.error); }
  };

  const finishPayment = async (id: string, total: number, p: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusy(true);
    const r = await p();
    setBusy(false);
    if (r.ok) { setUnpaid(null); setPlaced({ id, total, paid: true }); setStep("done"); }
    else setUnpaid({ id, total, msg: r.message ?? "Payment was not completed." });
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codOk && pay === "cod") { setErr(codReason); return; }
    if (pin && !pin.valid) { setErr("That pincode doesn't exist. Please check it."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: c, items: cart, coupon: applied?.code, saveAddress: !!customer && saveAddr, paymentMethod: pay }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "Could not place the order"); return; }
    clearCart();
    if (j.pay) { await finishPayment(j.id, j.total, () => payWithRazorpay(j.id, j.pay as PayParams)); return; }
    setPlaced({ id: j.id, total: j.total, paid: false }); setStep("done");
  };

  if (unpaid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-display text-4xl text-wine-800">Payment not completed</p>
        <p className="mt-3 text-ink/70">{unpaid.msg} Your order <span className="font-medium text-wine-800">{unpaid.id}</span> is saved and your items are held for 30 minutes.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button disabled={busy} onClick={() => finishPayment(unpaid.id, unpaid.total, () => retryPayment(unpaid.id, c.phone))} className="rounded-full bg-wine-700 px-7 py-3 text-sm text-white disabled:opacity-60">{busy ? "Opening…" : `Try again · ${inr(unpaid.total)}`}</button>
          <Link href={customer ? `/account/orders/${unpaid.id}` : `/track?id=${unpaid.id}`} className="rounded-full border border-wine-700 px-7 py-3 text-sm text-wine-700">Pay later from {customer ? "my account" : "Track Order"}</Link>
        </div>
        <p className="mt-6 text-xs text-ink/50">If money was deducted, don&apos;t pay again — it is confirmed automatically within a few minutes, or refunded by your bank.</p>
      </div>
    );
  }

  if (step === "done" && placed) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-xl px-4 py-24 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold-100 text-4xl text-gold-600">✓</motion.div>
        <p className="mt-6 font-display text-5xl text-wine-800">Thank you!</p>
        <p className="mt-3 text-ink/60">Your order <span className="font-medium text-wine-800">{placed.id}</span> for {inr(placed.total)} {placed.paid ? "is paid and confirmed. We'll send you the tracking number as soon as it ships." : "has been placed with cash on delivery. Our team will call you to confirm delivery."} Save your order number to track it anytime.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={customer ? `/account/orders/${placed.id}` : `/track?id=${placed.id}`} className="rounded-full border border-wine-700 px-7 py-3 text-sm text-wine-700">{customer ? "View in my account" : "Track this order"}</Link>
          <Link href="/shop" className="rounded-full bg-wine-700 px-7 py-3 text-sm text-white">Continue shopping</Link>
        </div>
      </motion.div>
    );
  }

  const input = "w-full rounded-xl border border-wine-100 bg-white px-4 py-3 text-sm outline-none focus:border-gold-400";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-5xl text-wine-800">{step === "bag" ? "Your Bag" : "Delivery Details"}</h1>
      {lines.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-gold-200 p-16 text-center">
          <p className="font-display text-3xl text-wine-800">Your bag is empty</p>
          <p className="mt-2 text-ink/60">Discover something you&apos;ll treasure.</p>
          <Link href="/shop" className="mt-6 inline-block rounded-full bg-wine-700 px-7 py-3 text-sm text-white">Shop jewellery</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <AnimatePresence mode="wait">
            {step === "bag" ? (
              <motion.ul key="bag" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <AnimatePresence initial={false}>
                  {lines.map(({ p, qty, size }) => (
                    <motion.li layout key={p.id} exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }} className="flex gap-3 overflow-hidden rounded-2xl border border-wine-100 bg-white p-3 sm:gap-4 sm:p-4">
                      <Link href={`/product/${p.id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28"><Photo src={p.images[0]} alt={p.name} w={300} className="h-full w-full" fallback={{ kind: p.category, metal: p.metal, stone: p.stone }} /></Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <Link href={`/product/${p.id}`} className="font-medium hover:text-wine-700">{p.name}</Link>
                          <button onClick={() => removeFromCart(p.id)} aria-label="Remove item" className="-m-2 shrink-0 self-start p-2 text-ink/40 hover:text-wine-700"><CloseIcon className="h-4 w-4" /></button>
                        </div>
                        <p className="text-xs text-ink/50">{p.purity} · {p.weight} g{size ? ` · Size ${size}` : ""}</p>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                          <div className="flex items-center rounded-full border border-wine-100">
                            <button onClick={() => setQty(p.id, qty - 1)} disabled={qty <= 1} className="px-3 py-1 disabled:opacity-30" aria-label="Decrease">−</button>
                            <span className="w-6 text-center text-sm">{qty}</span>
                            <button onClick={() => setQty(p.id, qty + 1)} disabled={qty >= MAX_QTY} className="px-3 py-1 disabled:opacity-30" aria-label="Increase">+</button>
                          </div>
                          <span className="font-semibold text-wine-800">{inr(price(p) * qty)}</span>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            ) : (
              <motion.form key="details" id="checkout" onSubmit={placeOrder} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid gap-3 rounded-3xl border border-wine-100 bg-white p-6 sm:grid-cols-2">
                {customer ? (
                  saved.length > 0 && (
                    <select aria-label="Saved addresses" onChange={(e) => { const a = saved.find((x) => x.id === e.target.value); if (a) setC({ ...c, name: a.name, phone: a.phone, address: a.address, city: a.city, pincode: a.pincode, state: a.state ?? "" }); }} className={`${input} sm:col-span-2`} defaultValue="">
                      <option value="" disabled>Choose a saved address…</option>
                      {saved.map((a) => <option key={a.id} value={a.id}>{a.label}: {a.address}, {a.city}</option>)}
                    </select>
                  )
                ) : (
                  <p className="rounded-xl bg-gold-100/60 px-4 py-3 text-sm text-ink/70 sm:col-span-2"><Link href="/login?next=/cart" className="font-medium text-wine-700">Log in</Link> to use saved addresses and track this order in your account — or continue as a guest.</p>
                )}
                <input required placeholder="Full name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className={input} aria-label="Full name" />
                <input required placeholder="Mobile number" inputMode="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} className={input} aria-label="Mobile number" />
                <input type="email" placeholder="Email (optional)" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} className={`${input} sm:col-span-2`} aria-label="Email" />
                <textarea required placeholder="House no., street, area" value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} className={`${input} min-h-24 sm:col-span-2`} aria-label="Address" />
                <input required placeholder="Pincode" inputMode="numeric" value={c.pincode} onChange={(e) => setC({ ...c, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className={input} aria-label="Pincode" />
                <input required placeholder="City" value={c.city} onChange={(e) => setC({ ...c, city: e.target.value })} className={input} aria-label="City" />
                <select required value={c.state} onChange={(e) => setC({ ...c, state: e.target.value })} className={`${input} sm:col-span-2`} aria-label="State">
                  <option value="" disabled>State</option>
                  {STATES.map((x) => <option key={x.code} value={x.name}>{x.name}</option>)}
                </select>
                {pin && (
                  <p className={`text-xs sm:col-span-2 ${!pin.valid || pin.deliverable === false ? "text-red-700" : "text-emerald-700"}`}>
                    {!pin.valid ? "That pincode doesn't exist — please check it." : pin.deliverable === false ? "Sorry, our courier doesn't deliver here yet. Please call us." : `✓ We deliver to ${pin.city ?? c.pincode} in ${pin.days ?? "3–7 working days"}.`}
                  </p>
                )}
                {showGst ? (
                  <input placeholder="GSTIN (optional, for business purchase)" value={c.gstin} onChange={(e) => setC({ ...c, gstin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15) })} className={`${input} sm:col-span-2`} aria-label="GSTIN" />
                ) : (
                  <button type="button" onClick={() => setShowGst(true)} className="text-left text-xs text-wine-700 underline sm:col-span-2">Buying for a business? Add your GSTIN</button>
                )}
                {customer && <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="accent-[#7a2a38]" /> Save this address to my account</label>}
                <fieldset className="space-y-2 sm:col-span-2">
                  <legend className="mb-2 text-sm font-medium text-wine-800">Payment</legend>
                  {online && (
                    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm ${pay === "online" ? "border-wine-700 bg-wine-50/40" : "border-wine-100"}`}>
                      <input type="radio" name="pay" checked={pay === "online"} onChange={() => setMethod("online")} className="mt-0.5 accent-[#7a2a38]" />
                      <span><span className="font-medium">Pay online</span><span className="block text-xs text-ink/60">UPI, cards, netbanking, wallets and EMI — secured by Razorpay</span></span>
                    </label>
                  )}
                  <label className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${!codOk ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${pay === "cod" ? "border-wine-700 bg-wine-50/40" : "border-wine-100"}`}>
                    <input type="radio" name="pay" disabled={!codOk} checked={pay === "cod"} onChange={() => setMethod("cod")} className="mt-0.5 accent-[#7a2a38]" />
                    <span><span className="font-medium">Cash on delivery</span>{st.codFee > 0 && codOk && <span className="text-ink/60"> (+{inr(st.codFee)})</span>}
                      <span className="block text-xs text-ink/60">{codOk ? "Pay in cash when your order arrives. Our team calls to confirm before dispatch." : codReason}</span></span>
                  </label>
                </fieldset>
                {err && <p className="text-sm text-red-700 sm:col-span-2">{err}</p>}
                <button type="button" onClick={() => setStep("bag")} className="text-left text-sm text-wine-700 underline sm:col-span-2">← Back to bag</button>
              </motion.form>
            )}
          </AnimatePresence>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-soft lg:sticky lg:top-36">
            <p className="font-display text-2xl text-wine-800">Order Summary</p>
            <form onSubmit={applyCode} className="mt-4 flex overflow-hidden rounded-full border border-wine-100">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className="w-full px-4 py-2.5 text-sm outline-none" />
              <button className="px-4 text-sm font-medium text-wine-700">Apply</button>
            </form>
            {msg && <p className="mt-2 text-xs text-ink/60">{msg}</p>}
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>{inr(subtotal)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount ({applied?.code})</dt><dd>−{inr(Math.min(discount, subtotal))}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink/60">Shipping</dt><dd>{shippingFee ? inr(shippingFee) : "Free"}</dd></div>
              {step === "details" && codFee > 0 && <div className="flex justify-between"><dt className="text-ink/60">Cash on delivery fee</dt><dd>{inr(codFee)}</dd></div>}
              <div className="flex justify-between border-t border-wine-100 pt-3 text-lg font-semibold text-wine-800"><dt>Total</dt><dd>{inr(step === "details" ? grand : afterDiscount + shippingFee)}</dd></div>
              <p className="text-right text-xs text-ink/50">Inclusive of 3% GST</p>
            </dl>
            {step === "bag" ? (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("details")} className="shine mt-6 w-full rounded-full bg-wine-700 py-3.5 text-sm font-medium text-white hover:bg-wine-800">Proceed to checkout</motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} form="checkout" disabled={busy} className="shine mt-6 w-full rounded-full bg-wine-700 py-3.5 text-sm font-medium text-white hover:bg-wine-800 disabled:opacity-60">{busy ? (pay === "online" ? "Opening payment…" : "Placing order…") : pay === "online" ? `Pay ${inr(grand)}` : "Place order"}</motion.button>
            )}
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-ink/50"><ShieldIcon className="h-4 w-4" />Secure, insured delivery</p>
          </aside>
        </div>
      )}
    </div>
  );
}
