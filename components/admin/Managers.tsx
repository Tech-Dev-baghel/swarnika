"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { img, inr } from "@/lib/pricing";
import type { Appointment, Order, OrderStatus, Rate, Settings, Subscriber } from "@/lib/types";
import { FieldInput, inputCls, type FieldDef } from "./fields";

const put = (resource: string, body: unknown) =>
  fetch(`/api/admin/${resource}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const del = (resource: string, id: string) => fetch(`/api/admin/${resource}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const STATUS_STYLE: Record<string, string> = {
  new: "bg-amber-100 text-amber-800", pending: "bg-amber-100 text-amber-800", confirmed: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800", delivered: "bg-emerald-100 text-emerald-800", done: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-600",
};

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="font-display text-4xl text-stone-900">{title}</h1>
      <p className="mt-1 text-sm text-stone-500">{sub}</p>
    </div>
  );
}

export function OrdersManager({ initial }: { initial: Order[] }) {
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const statuses: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];
  const saveNotes = async (o: Order, notes: string) => {
    if (notes === (o.notes ?? "")) return;
    setRows((rs) => rs.map((x) => (x.id === o.id ? { ...x, notes } : x)));
    const r = await put("orders", { id: o.id, notes });
    if (r.ok) { setSaved(o.id); window.setTimeout(() => setSaved(null), 1500); }
  };
  const setStatus = async (o: Order, status: OrderStatus) => {
    setRows((rs) => rs.map((x) => (x.id === o.id ? { ...x, status } : x)));
    const r = await put("orders", { id: o.id, status }); if (!r.ok) setRows(initial);
  };
  const ql = q.trim().toLowerCase();
  const shown = rows.filter((o) => (filter === "all" || o.status === filter) &&
    (!ql || [o.id, o.customer.name, o.customer.phone, o.customer.email, o.customer.city].some((v) => String(v ?? "").toLowerCase().includes(ql))));
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Header title="Orders" sub="Orders placed from the website checkout. Call the customer to confirm payment, then move the status along." />
        <a href="/api/admin/orders" className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">Export all (CSV)</a>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order no., name, phone, email or city…" aria-label="Search orders" className={`${inputCls} mt-6 max-w-md`} />
      <div className="mt-3 flex flex-wrap gap-2">
        {["all", ...statuses].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs capitalize ${filter === s ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}>
            {s} {s === "all" ? `(${rows.length})` : `(${rows.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {shown.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-4 px-4 py-3 text-left hover:bg-stone-50">
              <span className="font-mono text-sm font-medium">{o.id}</span>
              <span className="text-sm text-stone-600">{o.customer.name} · {o.customer.city}</span>
              <span className="text-xs text-stone-400">{when(o.createdAt)}</span>
              <span className="ml-auto font-medium">{inr(o.total)}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[o.status]}`}>{o.status}</span>
            </button>
            <AnimatePresence initial={false}>
              {open === o.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-stone-100">
                  <div className="grid gap-6 p-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Customer</p>
                      <p className="mt-1 text-sm">{o.customer.name}<br />{o.customer.phone}{o.customer.email && <> · {o.customer.email}</>}<br />{o.customer.address}, {o.customer.city} – {o.customer.pincode}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-stone-500">Status</span>
                        {statuses.map((s) => (
                          <button key={s} onClick={() => setStatus(o, s)} className={`rounded-full px-3 py-1 text-xs capitalize ${o.status === s ? STATUS_STYLE[s] + " ring-1 ring-current" : "bg-stone-100 text-stone-600"}`}>{s}</button>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a href={`tel:${o.customer.phone}`} className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs text-white">Call customer</a>
                        <a href={`https://wa.me/${o.customer.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs text-white">WhatsApp</a>
                        <a href={`/admin/orders/${o.id}`} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs">Invoice</a>
                        {o.customerId && <a href={`/admin/customers/${o.customerId}`} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs">Customer account</a>}
                      </div>
                      <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-stone-500">Private notes {saved === o.id && <span className="ml-2 normal-case text-emerald-700">saved</span>}
                        <textarea defaultValue={o.notes ?? ""} onBlur={(e) => saveNotes(o, e.target.value)} placeholder="Payment received by UPI, courier AWB no., etc." className={`${inputCls} mt-1 min-h-16 normal-case tracking-normal`} />
                      </label>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Items</p>
                      <ul className="mt-2 space-y-2">
                        {o.items.map((i) => (
                          <li key={i.id} className="flex items-center gap-3 text-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {i.image ? <img src={img(i.image, 100)} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="h-10 w-10 rounded bg-stone-100" />}
                            <span className="flex-1">{i.name}{i.size && <span className="text-stone-400"> · size {i.size}</span>} × {i.qty}</span>
                            <span>{inr(i.price * i.qty)}</span>
                          </li>
                        ))}
                      </ul>
                      <dl className="mt-3 space-y-1 border-t border-stone-100 pt-2 text-sm">
                        <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
                        {o.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {o.coupon}</dt><dd>−{inr(o.discount)}</dd></div>}
                        <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
                      </dl>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {shown.length === 0 && <p className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">{rows.length ? "No orders match." : "No orders yet. Place a test order from the website\u2019s bag to see it here."}</p>}
      </div>
    </div>
  );
}

export function AppointmentsManager({ initial }: { initial: Appointment[] }) {
  const [rows, setRows] = useState(initial);
  const statuses: Appointment["status"][] = ["pending", "confirmed", "done", "cancelled"];
  const setStatus = async (a: Appointment, status: Appointment["status"]) => {
    setRows((rs) => rs.map((x) => (x.id === a.id ? { ...x, status } : x)));
    await put("appointments", { id: a.id, status });
  };
  return (
    <div>
      <Header title="Appointments" sub="Store visit and video call requests from the store finder." />
      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Store</th><th className="px-4 py-3">Preferred time</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3"><p className="font-medium">{a.name}</p><a href={`tel:${a.phone}`} className="text-xs text-amber-700">{a.phone}</a></td>
                <td className="px-4 py-3">{a.type === "video" ? "📹 Video call" : "🏬 Store visit"}</td>
                <td className="px-4 py-3">{a.store}</td>
                <td className="px-4 py-3 text-stone-600">{a.date ? when(a.date) : "Any time"}<p className="text-xs text-stone-400">requested {when(a.createdAt)}</p></td>
                <td className="px-4 py-3">
                  <select value={a.status} onChange={(e) => setStatus(a, e.target.value as Appointment["status"])} className={`rounded-full border-0 px-2 py-1 text-xs capitalize ${STATUS_STYLE[a.status]}`}>
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-stone-500">No appointment requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SubscribersManager({ initial }: { initial: Subscriber[] }) {
  const [rows, setRows] = useState(initial);
  const csv = () => {
    const blob = new Blob(["email,joined\n" + rows.map((r) => `${r.email},${r.createdAt}`).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "subscribers.csv"; a.click();
  };
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Header title="Newsletter" sub="Emails collected from the footer sign-up." />
        <button onClick={csv} disabled={!rows.length} className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-40">Download CSV</button>
      </div>
      <ul className="mt-6 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
        {rows.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{s.email}</span>
            <span className="flex items-center gap-4 text-xs text-stone-400">{when(s.createdAt)}
              <button onClick={async () => { await del("subscribers", s.id); setRows((r) => r.filter((x) => x.id !== s.id)); }} className="text-red-600 hover:underline">Remove</button>
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-10 text-center text-sm text-stone-500">No subscribers yet.</li>}
      </ul>
    </div>
  );
}

const SETTINGS_FIELDS: FieldDef[] = [
  { key: "brandName", label: "Brand name", type: "text", required: true },
  { key: "phone", label: "Phone", type: "text" },
  { key: "whatsapp", label: "WhatsApp number (shows chat button)", type: "text", placeholder: "919876543210" },
  { key: "instagram", label: "Instagram URL", type: "text", placeholder: "https://instagram.com/yourstore" },
  { key: "email", label: "Email", type: "text" },
  { key: "address", label: "Head office address", type: "text" },
  { key: "tagline", label: "Footer tagline", type: "textarea", wide: true },
  { key: "promoEnabled", label: "Show offer strip at top", type: "checkbox" },
  { key: "promoLinkText", label: "Offer strip link text", type: "text" },
  { key: "promoText", label: "Offer strip text", type: "text", wide: true },
  { key: "promoLink", label: "Offer strip link", type: "text", placeholder: "/shop?category=coin" },
  { key: "savingsBonusPct", label: "Savings plan bonus (% of one instalment)", type: "number", min: 0 },
  { key: "marquee", label: "Scrolling text strip (separate with ·)", type: "text", wide: true },
  { key: "storeImage", label: "Store / experience photo", type: "image", wide: true },
];

export function SettingsForm({ initial }: { initial: { settings: Settings; rates: Rate[] } }) {
  const [s, setS] = useState<Settings>(initial.settings);
  const [rates, setRates] = useState<Rate[]>(initial.rates);
  const [state, setState] = useState<"idle" | "busy" | "saved">("idle");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: s, rates }) });
    setState(r.ok ? "saved" : "idle");
    if (r.ok) window.setTimeout(() => setState("idle"), 2500);
  };
  const now = () => new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return (
    <form onSubmit={save} className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Header title="Gold Rates & Settings" sub="Update today's rates and every product price on the website recalculates instantly." />
        <div className="flex items-center gap-3">
          <AnimatePresence>{state === "saved" && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">Saved — website updated</motion.span>}</AnimatePresence>
          <button disabled={state === "busy"} className="rounded-lg bg-amber-700 px-5 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60">{state === "busy" ? "Saving…" : "Save changes"}</button>
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl">Today&apos;s rates (₹ per gram)</h2>
          <div className="flex items-end gap-3">
            <label className="text-xs text-stone-500">City<input value={s.rateCity} onChange={(e) => setS({ ...s, rateCity: e.target.value })} className={`${inputCls} mt-1 w-36`} /></label>
            <label className="text-xs text-stone-500">Last updated<input value={s.rateUpdated} onChange={(e) => setS({ ...s, rateUpdated: e.target.value })} className={`${inputCls} mt-1 w-44`} /></label>
            <button type="button" onClick={() => setS({ ...s, rateUpdated: now() })} className="rounded-lg border border-stone-300 px-3 py-2 text-xs">Set to now</button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rates.map((r, i) => (
            <div key={r.purity} className="rounded-lg bg-amber-50 p-4">
              <p className="text-sm font-medium text-stone-800">{r.label}</p>
              <label className="mt-2 block text-xs text-stone-500">Rate / g
                <input type="number" value={r.perGram} min={0} onChange={(e) => setRates(rates.map((x, j) => (j === i ? { ...x, perGram: Number(e.target.value) } : x)))} className={`${inputCls} mt-1`} />
              </label>
              <label className="mt-2 block text-xs text-stone-500">Change today (%)
                <input type="number" step={0.01} value={r.change} onChange={(e) => setRates(rates.map((x, j) => (j === i ? { ...x, change: Number(e.target.value) } : x)))} className={`${inputCls} mt-1`} />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-display text-2xl">Store details & homepage</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SETTINGS_FIELDS.map((f) => (
            <label key={f.key} className={`block ${f.wide || f.type === "image" || f.type === "textarea" ? "sm:col-span-2" : ""}`}>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-500">{f.label}</span>
              <FieldInput f={f} value={(s as unknown as Record<string, unknown>)[f.key]} onChange={(v) => setS({ ...s, [f.key]: v })} />
            </label>
          ))}
        </div>
      </section>
    </form>
  );
}
