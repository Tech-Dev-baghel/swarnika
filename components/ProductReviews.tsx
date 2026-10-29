"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Review } from "@/lib/types";
import { StarIcon } from "./Icons";
import { Reveal } from "./Motion";

export default function ProductReviews({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const { customer } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ rating: 5, title: "", body: "" });
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, ...f }) });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? { ok: true, t: "Thank you! Your review will appear once our team approves it." } : { ok: false, t: j.error ?? "Could not send" });
    if (r.ok) { setOpen(false); setF({ rating: 5, title: "", body: "" }); }
  };
  return (
    <section id="reviews" className="mt-20">
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-wine-800">Customer reviews</h2>
          {reviews.length > 0 && <p className="mt-1 flex items-center gap-1 text-sm text-ink/60"><StarIcon className="h-4 w-4 text-gold-500" /> {avg.toFixed(1)} from {reviews.length} review{reviews.length === 1 ? "" : "s"}</p>}
        </div>
        {customer ? (
          <button onClick={() => setOpen(!open)} className="rounded-full border border-wine-700 px-5 py-2 text-sm text-wine-700">Write a review</button>
        ) : (
          <Link href={`/login?next=/product/${productId}%23reviews`} className="rounded-full border border-wine-700 px-5 py-2 text-sm text-wine-700">Log in to write a review</Link>
        )}
      </Reveal>
      {msg && <p className={`mt-4 rounded-xl p-3 text-sm ${msg.ok ? "bg-gold-100 text-ink/80" : "bg-red-50 text-red-700"}`}>{msg.t}</p>}
      {open && (
        <form onSubmit={submit} className="mt-6 grid gap-3 rounded-3xl border border-wine-100 bg-white p-6">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={f.rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setF({ ...f, rating: n })}>
                <StarIcon className={`h-7 w-7 ${n <= f.rating ? "text-gold-500" : "text-wine-100"}`} />
              </button>
            ))}
          </div>
          <input placeholder="Title (optional)" aria-label="Review title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="rounded-xl border border-wine-100 px-4 py-3 text-sm outline-none focus:border-gold-400" />
          <textarea required minLength={10} placeholder="What did you like? How does it look and feel?" aria-label="Review" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className="min-h-28 rounded-xl border border-wine-100 px-4 py-3 text-sm outline-none focus:border-gold-400" />
          <button className="justify-self-start rounded-full bg-wine-700 px-6 py-2.5 text-sm text-white">Submit review</button>
        </form>
      )}
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-wine-100 bg-white p-5">
            <div className="flex gap-0.5 text-gold-500">{[...Array(r.rating)].map((_, i) => <StarIcon key={i} className="h-4 w-4" />)}</div>
            {r.title && <p className="mt-2 font-medium">{r.title}</p>}
            <p className="mt-1 text-sm text-ink/75">{r.body}</p>
            <p className="mt-3 text-xs text-ink/50">{r.name} · {new Date(r.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} · Verified account</p>
          </li>
        ))}
        {!reviews.length && <li className="text-sm text-ink/60">No written reviews yet — be the first to share yours.</li>}
      </ul>
    </section>
  );
}
