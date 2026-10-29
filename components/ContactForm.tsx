"use client";

import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";

const field = "w-full rounded-xl border border-wine-100 bg-white px-4 py-3 text-sm outline-none focus:border-gold-400";
const SUBJECTS = ["Question about a product", "My order", "Custom / bridal jewellery", "Gold exchange", "Something else"];

export default function ContactForm() {
  const sp = useSearchParams();
  const { customer } = useStore();
  const [f, setF] = useState({ name: customer?.name ?? "", email: "", phone: "", subject: sp.get("subject") ?? SUBJECTS[0], body: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");
  if (state === "done") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-wine-100 bg-white p-10 text-center">
        <p className="font-display text-4xl text-wine-800">Thank you!</p>
        <p className="mt-2 text-ink/60">We&apos;ve received your message and will get back to you soon.</p>
      </motion.div>
    );
  }
  return (
    <form className="grid gap-3 rounded-3xl border border-wine-100 bg-white p-6 sm:grid-cols-2 sm:p-8" onSubmit={async (e) => {
      e.preventDefault(); setState("busy"); setErr("");
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setState("done"); else { setState("idle"); setErr(j.error ?? "Could not send"); }
    }}>
      <h2 className="font-display text-3xl text-wine-800 sm:col-span-2">Send a message</h2>
      <input required placeholder="Your name" aria-label="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={`${field} sm:col-span-2`} />
      <input type="email" placeholder="Email" aria-label="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={field} />
      <input inputMode="tel" placeholder="Phone" aria-label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={field} />
      <select aria-label="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={`${field} sm:col-span-2`}>
        {[...new Set([f.subject, ...SUBJECTS])].map((s) => <option key={s}>{s}</option>)}
      </select>
      <textarea required placeholder="How can we help?" aria-label="Message" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className={`${field} min-h-36 sm:col-span-2`} />
      {err && <p className="text-sm text-red-700 sm:col-span-2">{err}</p>}
      <p className="text-xs text-ink/50 sm:col-span-2">Add an email or phone so we can reply.</p>
      <button disabled={state === "busy"} className="rounded-full bg-wine-700 py-3 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2">{state === "busy" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
