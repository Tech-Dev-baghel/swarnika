"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    setBusy(false);
    if (r.ok) { router.push("/admin"); router.refresh(); return; }
    const j = await r.json().catch(() => ({}));
    setErr(r.status === 429 ? j.error : "That password isn't right.");
  };
  return (
    <div className="grid min-h-screen place-items-center bg-stone-900 p-4">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <p className="font-display text-3xl text-stone-900">Admin sign in</p>
        <p className="mt-1 text-sm text-stone-500">Manage products, rates, orders and the website.</p>
        <label className="mt-6 block text-xs font-medium uppercase tracking-wider text-stone-500">Password
          <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600" />
        </label>
        {err && <motion.p initial={{ x: -6 }} animate={{ x: [6, -6, 4, 0] }} className="mt-2 text-sm text-red-600">{err}</motion.p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-amber-700 py-2.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
        <a href="/" className="mt-4 block text-center text-xs text-stone-400 hover:text-stone-600">← Back to website</a>
      </motion.form>
    </div>
  );
}
