"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";

const field = "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20";

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-stone-900 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <p className="font-display text-3xl text-stone-900">{title}</p>
        <p className="mt-1 text-sm text-stone-500">{sub}</p>
        {children}
        <a href="/" className="mt-6 block text-center text-xs text-stone-400 hover:text-stone-600">← Back to website</a>
      </motion.div>
    </div>
  );
}

function PasswordInput({ value, onChange, label = "Password", auto = "current-password" }: { value: string; onChange: (v: string) => void; label?: string; auto?: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-stone-500">{label}
      <div className="relative">
        <input type={show ? "text" : "password"} required autoComplete={auto} value={value} onChange={(e) => onChange(e.target.value)} className={`${field} pr-14`} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 text-xs normal-case text-stone-500">{show ? "Hide" : "Show"}</button>
      </div>
    </label>
  );
}

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <Card title="Admin sign in" sub="Staff access to orders, products and settings.">
      <form onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr("");
        const { ok, j } = await post("/api/admin/login", { email, password: pw });
        setBusy(false);
        if (ok) { router.push("/admin"); router.refresh(); } else setErr(j.error ?? "Could not sign in");
      }}>
        <label className="mt-6 block text-xs font-medium uppercase tracking-wider text-stone-500">Email
          <input type="email" required autoFocus autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <PasswordInput value={pw} onChange={setPw} />
        {err && <motion.p initial={{ x: -6 }} animate={{ x: [6, -6, 4, 0] }} className="mt-3 text-sm text-red-600">{err}</motion.p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-amber-700 py-2.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
        <Link href="/admin/forgot" className="mt-3 block text-center text-xs text-amber-700">Forgot password?</Link>
      </form>
    </Card>
  );
}

export function SetupForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <Card title="Create the owner account" sub="First-time setup. This account can add other staff later. This page disappears once it's done.">
      <form onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr("");
        const { ok, j } = await post("/api/admin/setup", f);
        setBusy(false);
        if (ok) { router.push("/admin"); router.refresh(); } else setErr(j.error ?? "Could not create account");
      }}>
        <label className="mt-6 block text-xs font-medium uppercase tracking-wider text-stone-500">Your name
          <input required autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} />
        </label>
        <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-stone-500">Email
          <input type="email" required autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={field} />
        </label>
        <PasswordInput value={f.password} onChange={(v) => setF({ ...f, password: v })} auto="new-password" />
        <p className="mt-1 text-xs text-stone-400">At least 8 characters with a letter and a number.</p>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-amber-700 py-2.5 text-sm font-medium text-white disabled:opacity-60">{busy ? "Creating…" : "Create owner account"}</button>
      </form>
    </Card>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <Card title="Forgot password" sub="We'll email you a link to set a new password.">
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); const { j } = await post("/api/admin/forgot", { email }); setBusy(false); setMsg(j.message ?? j.error); }}>
        <label className="mt-6 block text-xs font-medium uppercase tracking-wider text-stone-500">Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        {msg && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-stone-700">{msg}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-lg bg-amber-700 py-2.5 text-sm font-medium text-white disabled:opacity-60">Send reset link</button>
        <Link href="/admin/login" className="mt-3 block text-center text-xs text-amber-700">Back to sign in</Link>
      </form>
    </Card>
  );
}

export function AdminResetForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [done, setDone] = useState(false);
  return (
    <Card title="Set a new password" sub="Choose a password you don't use elsewhere.">
      {done ? (
        <button onClick={() => router.push("/admin/login")} className="mt-6 w-full rounded-lg bg-amber-700 py-2.5 text-sm font-medium text-white">Password changed — sign in</button>
      ) : (
        <form onSubmit={async (e) => { e.preventDefault(); const { ok, j } = await post("/api/admin/reset", { token: sp.get("token"), password: pw }); if (ok) setDone(true); else setErr(j.error); }}>
          <PasswordInput value={pw} onChange={setPw} label="New password" auto="new-password" />
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
          <button className="mt-6 w-full rounded-lg bg-amber-700 py-2.5 text-sm font-medium text-white">Save password</button>
        </form>
      )}
    </Card>
  );
}
