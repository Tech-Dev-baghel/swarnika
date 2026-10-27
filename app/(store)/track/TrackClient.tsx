"use client";

import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Photo from "@/components/Photo";
import { inr } from "@/lib/pricing";

type Result = { id: string; createdAt: string; status: string; total: number; city: string; items: { name: string; qty: number; image?: string }[] };
const STEPS = ["new", "confirmed", "shipped", "delivered"];
const LABEL: Record<string, string> = { new: "Order placed", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

export default function TrackClient() {
  const sp = useSearchParams();
  const [id, setId] = useState(sp.get("id") ?? "");
  const [phone, setPhone] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(""); setRes(null);
    const r = await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, phone }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) setRes(j); else setErr(j.error ?? "Something went wrong");
  };
  const step = res ? STEPS.indexOf(res.status) : -1;
  const input = "w-full rounded-full border border-wine-100 bg-white px-5 py-3 text-sm outline-none focus:border-gold-400";
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-5xl text-wine-800">Track Your Order</h1>
      <p className="mt-2 text-ink/60">Enter the order number from your confirmation and the phone number you used at checkout.</p>
      <form onSubmit={submit} className="mt-8 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input required value={id} onChange={(e) => setId(e.target.value)} placeholder="Order number (ORD-…)" aria-label="Order number" className={input} />
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" aria-label="Phone number" className={input} />
        <button disabled={busy} className="rounded-full bg-wine-700 px-6 py-3 text-sm font-medium text-white disabled:opacity-60">{busy ? "Checking…" : "Track"}</button>
      </form>
      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}
      {res && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-3xl border border-wine-100 bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-sm">{res.id}</p>
            <p className="text-sm text-ink/60">{new Date(res.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {inr(res.total)}</p>
          </div>
          {res.status === "cancelled" ? (
            <p className="mt-6 rounded-xl bg-wine-50 p-4 text-sm text-wine-800">This order was cancelled. Please contact us if this is unexpected.</p>
          ) : (
            <ol className="mt-8 grid grid-cols-4 gap-2">
              {STEPS.map((s, i) => (
                <li key={s} className="text-center">
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.15 }} className={`h-1.5 origin-left rounded-full ${i <= step ? "bg-gold-500" : "bg-wine-100"}`} />
                  <p className={`mt-2 text-xs ${i <= step ? "font-medium text-wine-800" : "text-ink/40"}`}>{LABEL[s]}</p>
                </li>
              ))}
            </ol>
          )}
          <ul className="mt-6 space-y-3">
            {res.items.map((i) => (
              <li key={i.name} className="flex items-center gap-3 text-sm">
                <Photo src={i.image} alt="" w={120} className="h-12 w-12 shrink-0 rounded-lg" />
                <span>{i.name} × {i.qty}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
