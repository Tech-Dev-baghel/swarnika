"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { useEscape } from "@/lib/hooks";
import { useData } from "@/lib/data-context";
import { useStore } from "@/lib/store";
import { CalendarIcon, CloseIcon, PinIcon, VideoIcon } from "./Icons";

function BookingForm({ store, type, onDone }: { store: string; type: "visit" | "video"; onDone: () => void }) {
  const [f, setF] = useState({ name: "", phone: "", date: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, store, type }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) onDone(); else setErr(j.error ?? "Could not book right now");
  };
  const input = "w-full rounded-lg border border-wine-100 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold-400";
  return (
    <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} onSubmit={submit} className="mt-3 grid gap-2 overflow-hidden sm:grid-cols-3">
      <input required placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input} aria-label="Your name" />
      <input required placeholder="Phone" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={input} aria-label="Phone" />
      <input type="datetime-local" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={input} aria-label="Preferred time" />
      <button disabled={busy} className="rounded-full bg-wine-700 py-2 text-xs font-medium text-white sm:col-span-3">{busy ? "Booking…" : type === "video" ? "Request video call" : "Request store visit"}</button>
      {err && <p className="text-xs text-red-700 sm:col-span-3">{err}</p>}
    </motion.form>
  );
}

export function StoreFinder({ compact = false }: { compact?: boolean }) {
  const { stores } = useData();
  const cities = useMemo(() => Array.from(new Set(stores.map((s) => s.city))), [stores]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<{ id: string; type: "visit" | "video" } | null>(null);
  const [booked, setBooked] = useState<string[]>([]);
  const list = stores.filter((s) => !q || (s.city + s.name + s.address).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Enter city or pincode" aria-label="Search stores"
        className="w-full rounded-full border border-wine-100 bg-white px-5 py-3 text-sm outline-none focus:border-gold-400" />
      <div className="mt-3 flex flex-wrap gap-2">
        {cities.map((c) => (
          <button key={c} onClick={() => setQ(q === c ? "" : c)} className={`rounded-full border px-3 py-1 text-xs transition-colors ${q === c ? "border-wine-700 bg-wine-700 text-white" : "border-wine-100 hover:border-gold-400"}`}>{c}</button>
        ))}
      </div>
      <motion.ul layout className={`mt-4 space-y-3 overflow-y-auto pr-1 ${compact ? "max-h-[50vh]" : ""}`}>
        <AnimatePresence initial={false}>
          {list.map((s) => (
            <motion.li layout key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-wine-100 bg-white p-4">
              <p className="flex items-center gap-2 font-medium text-wine-800"><PinIcon className="h-4 w-4 text-gold-600" />{s.name}</p>
              <p className="mt-1 text-sm text-ink/70">{s.address}</p>
              <p className="mt-1 text-xs text-ink/50">{s.hours} · {s.phone}</p>
              {booked.includes(s.id) ? (
                <p className="mt-3 rounded-lg bg-gold-100 px-3 py-2 text-xs text-gold-600">Request received — the store will call you to confirm a time.</p>
              ) : (
                <>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setOpen({ id: s.id, type: "visit" })} className="flex items-center gap-1 rounded-full bg-wine-700 px-3 py-1.5 text-xs text-white"><CalendarIcon className="h-3.5 w-3.5" />Book visit</button>
                    <button onClick={() => setOpen({ id: s.id, type: "video" })} className="flex items-center gap-1 rounded-full border border-wine-700 px-3 py-1.5 text-xs text-wine-700"><VideoIcon className="h-3.5 w-3.5" />Video call</button>
                  </div>
                  {open?.id === s.id && <BookingForm key={open.type} store={s.name} type={open.type} onDone={() => { setBooked((b) => [...b, s.id]); setOpen(null); }} />}
                </>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
        {list.length === 0 && <li className="text-sm text-ink/60">No stores match yet — try another city.</li>}
      </motion.ul>
    </div>
  );
}

export default function Overlays() {
  const { toast, storeOpen, setStoreOpen, cartCount } = useStore();
  const { settings } = useData();
  useEscape(storeOpen, useCallback(() => setStoreOpen(false), [setStoreOpen]));
  const wa = settings.whatsapp.replace(/\D/g, "");
  return (
    <>
      <AnimatePresence>
        {storeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setStoreOpen(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full max-w-lg rounded-t-3xl bg-ivory p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-3xl text-wine-800">Find a store</h3>
                <button onClick={() => setStoreOpen(false)} aria-label="Close"><CloseIcon /></button>
              </div>
              <StoreFinder compact />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {wa && (
        <motion.a
          href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${settings.brandName}, I have a question about your jewellery.`)}`}
          target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2, type: "spring" }} whileHover={{ scale: 1.08 }}
          className={`fixed right-5 z-[55] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg ${cartCount ? "bottom-20 sm:bottom-6" : "bottom-6"}`}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z"/></svg>
        </motion.a>
      )}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className="rounded-full bg-wine-900 px-5 py-2.5 text-sm text-gold-100 shadow-soft"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
