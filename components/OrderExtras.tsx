"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { retryPayment } from "@/lib/razorpay-client";
import type { PaymentMethod, PaymentStatus, TrackEvent } from "@/lib/types";

const PAY_LABEL: Record<string, [string, string]> = {
  cod: ["Cash on delivery", "bg-gold-100 text-gold-600"],
  pending: ["Payment pending", "bg-amber-100 text-amber-800"],
  paid: ["Paid", "bg-emerald-100 text-emerald-800"],
  expired: ["Payment not received", "bg-stone-200 text-stone-600"],
  refunded: ["Refunded", "bg-sky-100 text-sky-800"],
};
export function PaymentPill({ method, status }: { method?: PaymentMethod; status?: PaymentStatus }) {
  const s = status ?? "cod";
  const [label, cls] = PAY_LABEL[s] ?? [s, ""];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs ${cls}`}>{s === "paid" && method === "cod" ? "Paid (cash)" : label}</span>;
}

/** "Pay now" for an online order that hasn't been paid yet. */
export function PayNow({ orderId, phone, total, onPaid }: { orderId: string; phone?: string; total: number; onPaid?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div className="rounded-2xl bg-amber-50 p-4 text-sm">
      <p className="font-medium text-amber-900">Payment not completed yet</p>
      <p className="mt-1 text-amber-900/80">We&apos;re holding your items for 30 minutes from when you placed the order. Complete the payment to confirm it.</p>
      <button disabled={busy} onClick={async () => {
        setBusy(true); setMsg("");
        const r = await retryPayment(orderId, phone);
        setBusy(false);
        if (r.ok) (onPaid ?? router.refresh)(); else setMsg(r.message);
      }} className="mt-3 rounded-full bg-wine-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">{busy ? "Opening…" : `Pay ₹${total.toLocaleString("en-IN")} now`}</button>
      {msg && <p className="mt-2 text-xs text-red-700">{msg}</p>}
    </div>
  );
}

export function ShipmentBox({ carrier, awb, status, events }: { carrier: string; awb: string; status: string; events: TrackEvent[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-wine-100 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p><span className="text-ink/60">Courier:</span> <span className="font-medium">{carrier}</span></p>
        <p className="text-xs text-ink/60">{status}</p>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-2"><span className="text-ink/60">Tracking no. (AWB):</span> <span className="font-mono font-medium">{awb}</span>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(awb).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }} className="rounded-full border border-wine-100 px-2 py-0.5 text-xs text-wine-700">{copied ? "Copied" : "Copy"}</button>
      </p>
      {events.length > 0 && (
        <ol className="mt-4 space-y-3 border-l-2 border-gold-200 pl-4">
          {events.map((e, i) => (
            <li key={i} className="relative">
              <span className={`absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-gold-500" : "bg-wine-100"}`} />
              <p className={i === 0 ? "font-medium text-wine-800" : "text-ink/80"}>{e.status}</p>
              <p className="text-xs text-ink/50">{new Date(e.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}{e.location ? ` · ${e.location}` : ""}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
