"use client";

import { useState } from "react";
import { inr } from "@/lib/pricing";
import type { Order } from "@/lib/types";
import { inputCls } from "./fields";

const post = async (url: string, body: unknown) => {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, j };
};
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "");

export const PAY_STYLE: Record<string, [string, string]> = {
  cod: ["COD", "bg-orange-100 text-orange-800"], pending: ["Awaiting payment", "bg-amber-100 text-amber-800"], paid: ["Paid", "bg-emerald-100 text-emerald-800"],
  expired: ["Not paid", "bg-stone-200 text-stone-600"], refunded: ["Refunded", "bg-sky-100 text-sky-800"],
};
export const PayBadge = ({ o }: { o: Order }) => {
  const [l, c] = PAY_STYLE[o.paymentStatus ?? "cod"] ?? ["", ""];
  return <span className={`rounded-full px-2 py-0.5 text-xs ${c}`}>{o.paymentStatus === "paid" && o.paymentMethod === "cod" ? "COD collected" : l}</span>;
};

/** Payment details + refund, and courier booking / tracking for one order. */
export function OrderOps({ o, dtdc, canRefund, onChange }: { o: Order; dtdc: boolean; canRefund: boolean; onChange: (o: Order) => void }) {
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [w, setW] = useState("0.5");
  const [dims, setDims] = useState({ l: "15", b: "12", h: "8" });
  const [manual, setManual] = useState({ carrierName: "DTDC", awb: "" });
  const [refund, setRefund] = useState("");
  const sh = o.shipment && !o.shipment.cancelled ? o.shipment : null;
  const run = async (key: string, url: string, body: unknown, confirmText?: string) => {
    if (confirmText && busy !== `confirm:${key}`) { setBusy(`confirm:${key}`); setErr(confirmText); return; }
    setBusy(key); setErr("");
    const { ok, j } = await post(url, body);
    setBusy("");
    if (ok) onChange(j as Order); else setErr(j.error ?? "Something went wrong");
  };
  const unpaidOnline = o.paymentMethod === "online" && o.paymentStatus !== "paid";

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-stone-200 p-4 text-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Payment</p>
          <p className="mt-2 flex flex-wrap items-center gap-2">{o.paymentMethod === "online" ? "Online (Razorpay)" : "Cash on delivery"} <PayBadge o={o} /></p>
          {o.payment?.paymentId && <p className="mt-1 text-xs text-stone-500">Payment ID <span className="font-mono">{o.payment.paymentId}</span>{o.payment.method ? ` · ${o.payment.method}` : ""} · {when(o.payment.paidAt)}</p>}
          {o.payment?.rzpOrderId && !o.payment.paymentId && <p className="mt-1 text-xs text-stone-500">Razorpay order <span className="font-mono">{o.payment.rzpOrderId}</span></p>}
          {o.payment?.lastError && o.paymentStatus === "pending" && <p className="mt-1 text-xs text-red-700">Last attempt: {o.payment.lastError}</p>}
          {o.paymentStatus === "pending" && <p className="mt-1 text-xs text-amber-800">Don&apos;t ship yet. Unpaid online orders cancel themselves after 30 minutes and the stock is released.</p>}
          {o.paymentStatus === "cod" && <p className="mt-1 text-xs text-stone-500">Collect {inr(o.total)} on delivery. It is marked collected when the order is delivered.</p>}
          {o.paymentStatus === "refunded" && <p className="mt-1 text-xs text-sky-800">Refunded {inr(o.payment?.refundAmount ?? o.total)} · {o.payment?.refundId} · {when(o.payment?.refundedAt)}</p>}
          {o.paymentStatus === "paid" && o.paymentMethod === "online" && canRefund && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input value={refund} onChange={(e) => setRefund(e.target.value.replace(/\D/g, ""))} placeholder={`Amount (max ${o.total})`} aria-label="Refund amount" className={`${inputCls} w-40`} />
              <button disabled={!!busy && !busy.startsWith("confirm")} onClick={() => run("refund", `/api/admin/orders/${o.id}/refund`, { amount: refund ? Number(refund) : undefined }, `Refund ${inr(refund ? Number(refund) : o.total)} to the customer? Press Refund again to confirm.`)}
                className="rounded-lg border border-red-300 px-3 py-2 text-xs text-red-700">{busy === "refund" ? "Refunding…" : "Refund"}</button>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-stone-200 p-4 text-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Shipping</p>
          {sh ? (
            <>
              <p className="mt-2">{sh.carrier === "dtdc" ? "DTDC" : sh.carrierName} · AWB <span className="font-mono font-medium">{sh.awb}</span></p>
              <p className="text-xs text-stone-500">{sh.status}{sh.checkedAt ? ` · checked ${when(sh.checkedAt)}` : ""}{sh.codAmount ? ` · COD ${inr(sh.codAmount)}` : ""}</p>
              {sh.events[0] && <p className="mt-1 text-xs text-stone-600">Latest: {sh.events[0].status}{sh.events[0].location ? `, ${sh.events[0].location}` : ""} ({when(sh.events[0].at)})</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {sh.carrier === "dtdc" && dtdc && <a href={`/api/admin/orders/${o.id}/label`} target="_blank" rel="noreferrer" className="rounded-lg bg-stone-900 px-3 py-2 text-xs text-white">Print label</a>}
                {sh.carrier === "dtdc" && <button disabled={!!busy && !busy.startsWith("confirm")} onClick={() => run("refresh", `/api/admin/orders/${o.id}/shipment`, { action: "refresh" })} className="rounded-lg border border-stone-300 px-3 py-2 text-xs">{busy === "refresh" ? "Checking…" : "Refresh tracking"}</button>}
                {o.status !== "delivered" && <button disabled={!!busy && !busy.startsWith("confirm")} onClick={() => run("cancel", `/api/admin/orders/${o.id}/shipment`, { action: "cancel" }, "Cancel this shipment with the courier? Press Cancel shipment again to confirm.")} className="rounded-lg border border-red-300 px-3 py-2 text-xs text-red-700">{busy === "cancel" ? "Cancelling…" : "Cancel shipment"}</button>}
              </div>
            </>
          ) : o.status === "cancelled" ? <p className="mt-2 text-stone-500">Order cancelled.</p> : unpaidOnline ? <p className="mt-2 text-amber-800">Waiting for payment before shipping.</p> : (
            <>
              {dtdc ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-stone-500">Book a DTDC pickup. Enter the packed parcel&apos;s weight and size.</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs text-stone-500">Weight (kg)<input value={w} onChange={(e) => setW(e.target.value)} inputMode="decimal" className={`${inputCls} mt-1 w-24`} /></label>
                    <label className="text-xs text-stone-500">L×B×H (cm)
                      <span className="mt-1 flex gap-1">{(["l", "b", "h"] as const).map((k) => <input key={k} value={dims[k]} onChange={(e) => setDims({ ...dims, [k]: e.target.value.replace(/\D/g, "") })} aria-label={`Size ${k}`} className={`${inputCls} w-14`} />)}</span>
                    </label>
                    <button disabled={!!busy && !busy.startsWith("confirm")} onClick={() => run("create", `/api/admin/orders/${o.id}/shipment`, { action: "create", weightKg: Number(w), lengthCm: Number(dims.l), widthCm: Number(dims.b), heightCm: Number(dims.h) })}
                      className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-medium text-white">{busy === "create" ? "Booking…" : "Book DTDC shipment"}</button>
                  </div>
                  {o.paymentStatus === "cod" && <p className="text-xs text-orange-800">DTDC will collect {inr(o.total)} cash from the customer.</p>}
                </div>
              ) : <p className="mt-2 text-xs text-stone-500">DTDC isn&apos;t connected yet (add the DTDC keys in Vercel). You can still add a tracking number for a parcel you booked yourself:</p>}
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
                <label className="text-xs text-stone-500">Courier<input value={manual.carrierName} onChange={(e) => setManual({ ...manual, carrierName: e.target.value })} className={`${inputCls} mt-1 w-28`} /></label>
                <label className="text-xs text-stone-500">Tracking no. (AWB)<input value={manual.awb} onChange={(e) => setManual({ ...manual, awb: e.target.value.trim() })} className={`${inputCls} mt-1 w-40`} /></label>
                <button disabled={!manual.awb || (!!busy && !busy.startsWith("confirm"))} onClick={() => run("manual", `/api/admin/orders/${o.id}/shipment`, { action: "manual", ...manual })} className="rounded-lg border border-stone-300 px-3 py-2 text-xs disabled:opacity-50">{busy === "manual" ? "Saving…" : "Add tracking number"}</button>
              </div>
            </>
          )}
        </section>
      </div>
      {err && <p className={`text-sm ${busy.startsWith("confirm") ? "text-amber-800" : "text-red-700"}`}>{err}</p>}
    </div>
  );
}
