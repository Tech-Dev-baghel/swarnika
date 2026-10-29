"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import type { Address, Customer } from "@/lib/types";

export const field = "w-full rounded-xl border border-wine-100 bg-white px-4 py-3 text-sm outline-none focus:border-gold-400";
const label = "block text-xs font-medium uppercase tracking-wider text-ink/60";
async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}

function Password({ value, onChange, lbl = "Password", auto = "current-password", name = "password" }: { value: string; onChange: (v: string) => void; lbl?: string; auto?: string; name?: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className={label}>{lbl}
      <div className="relative mt-1">
        <input name={name} type={show ? "text" : "password"} required autoComplete={auto} value={value} onChange={(e) => onChange(e.target.value)} className={`${field} pr-16 normal-case tracking-normal`} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs normal-case tracking-normal text-wine-700">{show ? "Hide" : "Show"}</button>
      </div>
    </label>
  );
}

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-wine-100 bg-white p-6 shadow-soft sm:p-8">
        <h1 className="font-display text-4xl text-wine-800">{title}</h1>
        <p className="mt-1 text-sm text-ink/60">{sub}</p>
        {children}
      </motion.div>
    </div>
  );
}

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

export function CustomerLogin() {
  const router = useRouter();
  const sp = useSearchParams();
  const [id, setId] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <Shell title="Welcome back" sub="Log in to track orders, save addresses and keep your wishlist on every device.">
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr("");
        const { ok, j } = await call("/api/auth/login", "POST", { identifier: id, password: pw });
        setBusy(false);
        if (ok) { router.push(safeNext(sp.get("next"))); router.refresh(); } else setErr(j.error ?? "Could not log in");
      }}>
        <label className={label}>Email or mobile number
          <input name="identifier" required autoFocus autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} className={`${field} mt-1 normal-case tracking-normal`} />
        </label>
        <Password value={pw} onChange={setPw} />
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="w-full rounded-full bg-wine-700 py-3 text-sm font-medium text-white disabled:opacity-60">{busy ? "Logging in…" : "Log in"}</button>
        <div className="flex justify-between text-sm">
          <Link href="/forgot-password" className="text-wine-700">Forgot password?</Link>
          <Link href={`/register${sp.get("next") ? `?next=${encodeURIComponent(sp.get("next")!)}` : ""}`} className="text-wine-700">Create an account</Link>
        </div>
      </form>
    </Shell>
  );
}

export function CustomerRegister() {
  const router = useRouter();
  const sp = useSearchParams();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <Shell title="Create your account" sub="Use your email, your mobile number, or both.">
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr("");
        const { ok, j } = await call("/api/auth/register", "POST", f);
        setBusy(false);
        if (ok) { router.push(safeNext(sp.get("next"))); router.refresh(); } else setErr(j.error ?? "Could not create account");
      }}>
        <label className={label}>Full name<input name="name" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={`${field} mt-1 normal-case tracking-normal`} /></label>
        <label className={label}>Email<input name="email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={`${field} mt-1 normal-case tracking-normal`} /></label>
        <label className={label}>Mobile number<input name="phone" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={`${field} mt-1 normal-case tracking-normal`} /></label>
        <Password value={f.password} onChange={(v) => setF({ ...f, password: v })} auto="new-password" />
        <p className="-mt-2 text-xs text-ink/50">At least 8 characters with a letter and a number.</p>
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="w-full rounded-full bg-wine-700 py-3 text-sm font-medium text-white disabled:opacity-60">{busy ? "Creating…" : "Create account"}</button>
        <p className="text-center text-sm">Already have an account? <Link href="/login" className="text-wine-700">Log in</Link></p>
      </form>
    </Shell>
  );
}

export function CustomerForgot() {
  const [id, setId] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <Shell title="Forgot password" sub="Enter the email or mobile number on your account.">
      <form className="mt-6 space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const { j } = await call("/api/auth/forgot", "POST", { identifier: id }); setBusy(false); setMsg(j.message ?? j.error); }}>
        <input required aria-label="Email or mobile number" placeholder="Email or mobile number" value={id} onChange={(e) => setId(e.target.value)} className={field} />
        {msg && <p className="rounded-xl bg-gold-100 p-3 text-sm text-ink/80">{msg}</p>}
        <button disabled={busy} className="w-full rounded-full bg-wine-700 py-3 text-sm font-medium text-white disabled:opacity-60">Send reset link</button>
        <p className="text-center text-sm"><Link href="/login" className="text-wine-700">Back to log in</Link></p>
      </form>
    </Shell>
  );
}

export function CustomerReset() {
  const sp = useSearchParams();
  const router = useRouter();
  const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  return (
    <Shell title="Set a new password" sub="You'll be logged in straight away.">
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        const { ok, j } = await call("/api/auth/reset", "POST", { token: sp.get("token"), password: pw });
        if (ok) { router.push("/account"); router.refresh(); } else setErr(j.error);
      }}>
        <Password value={pw} onChange={setPw} lbl="New password" auto="new-password" />
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="w-full rounded-full bg-wine-700 py-3 text-sm font-medium text-white">Save and log in</button>
      </form>
    </Shell>
  );
}

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return <button onClick={async () => { await call("/api/auth/logout", "POST"); router.push("/"); router.refresh(); }} className={className}>Log out</button>;
}

export function ProfileForms({ me }: { me: Customer }) {
  const router = useRouter();
  const [p, setP] = useState({ name: me.name, email: me.email ?? "", phone: me.phone ?? "" });
  const [pw, setPw] = useState({ current: "", password: "" });
  const [m1, setM1] = useState<{ ok: boolean; t: string } | null>(null);
  const [m2, setM2] = useState<{ ok: boolean; t: string } | null>(null);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="space-y-4 rounded-3xl border border-wine-100 bg-white p-6" onSubmit={async (e) => {
        e.preventDefault(); const { ok, j } = await call("/api/account", "PUT", p);
        setM1(ok ? { ok, t: "Profile saved." } : { ok, t: j.error }); if (ok) router.refresh();
      }}>
        <h2 className="font-display text-2xl text-wine-800">Your details</h2>
        <label className={label}>Full name<input required value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} className={`${field} mt-1 normal-case tracking-normal`} /></label>
        <label className={label}>Email<input type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} className={`${field} mt-1 normal-case tracking-normal`} /></label>
        <label className={label}>Mobile number<input inputMode="tel" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} className={`${field} mt-1 normal-case tracking-normal`} /></label>
        {m1 && <p className={`text-sm ${m1.ok ? "text-emerald-700" : "text-red-700"}`}>{m1.t}</p>}
        <button className="rounded-full bg-wine-700 px-6 py-2.5 text-sm text-white">Save details</button>
      </form>
      <form className="space-y-4 rounded-3xl border border-wine-100 bg-white p-6" onSubmit={async (e) => {
        e.preventDefault(); const { ok, j } = await call("/api/account/password", "PUT", pw);
        setM2(ok ? { ok, t: "Password changed. Other devices have been logged out." } : { ok, t: j.error }); if (ok) setPw({ current: "", password: "" });
      }}>
        <h2 className="font-display text-2xl text-wine-800">Change password</h2>
        <Password value={pw.current} onChange={(v) => setPw({ ...pw, current: v })} lbl="Current password" name="current" />
        <Password value={pw.password} onChange={(v) => setPw({ ...pw, password: v })} lbl="New password" auto="new-password" name="new" />
        {m2 && <p className={`text-sm ${m2.ok ? "text-emerald-700" : "text-red-700"}`}>{m2.t}</p>}
        <button className="rounded-full bg-wine-700 px-6 py-2.5 text-sm text-white">Change password</button>
      </form>
    </div>
  );
}

const blank = (): Address => ({ id: "", label: "Home", name: "", phone: "", address: "", city: "", pincode: "", isDefault: false });
export function AddressBook({ initial }: { initial: Address[] }) {
  const [list, setList] = useState(initial);
  const [edit, setEdit] = useState<Address | null>(null);
  const [err, setErr] = useState("");
  const save = async (next: Address[]) => {
    const { ok, j } = await call("/api/account/addresses", "PUT", { addresses: next });
    if (!ok) { setErr(j.error); return false; }
    setList(j.addresses); setErr(""); return true;
  };
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((a) => (
          <div key={a.id} className="rounded-2xl border border-wine-100 bg-white p-5 text-sm">
            <p className="font-medium text-wine-800">{a.label}{a.isDefault && <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-xs text-gold-600">Default</span>}</p>
            <p className="mt-2">{a.name} · {a.phone}<br />{a.address}<br />{a.city} – {a.pincode}</p>
            <div className="mt-2 flex flex-wrap gap-1 text-xs [&>button]:rounded-lg [&>button]:px-2 [&>button]:py-2 -ml-2">
              <button onClick={() => setEdit(a)} className="text-wine-700">Edit</button>
              {!a.isDefault && <button onClick={() => save(list.map((x) => ({ ...x, isDefault: x.id === a.id })))} className="text-wine-700">Make default</button>}
              <button onClick={() => save(list.filter((x) => x.id !== a.id))} className="text-red-700">Remove</button>
            </div>
          </div>
        ))}
        <button onClick={() => setEdit(blank())} className="grid min-h-40 place-items-center rounded-2xl border-2 border-dashed border-gold-200 text-sm text-wine-700 hover:border-gold-400">＋ Add a new address</button>
      </div>
      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}
      {edit && (
        <form className="mt-6 grid gap-3 rounded-3xl border border-wine-100 bg-white p-6 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault();
          let next = edit.id ? list.map((x) => (x.id === edit.id ? edit : x)) : [...list, edit];
          if (edit.isDefault) next = next.map((x) => ({ ...x, isDefault: x === edit }));
          if (await save(next)) setEdit(null);
        }}>
          <h2 className="font-display text-2xl text-wine-800 sm:col-span-2">{edit.id ? "Edit address" : "New address"}</h2>
          <input placeholder="Label (Home, Office…)" aria-label="Label" value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })} className={field} />
          <input required placeholder="Full name" aria-label="Full name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={field} />
          <input required placeholder="Mobile number" aria-label="Mobile number" inputMode="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} className={field} />
          <input required placeholder="Pincode" aria-label="Pincode" inputMode="numeric" value={edit.pincode} onChange={(e) => setEdit({ ...edit, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className={field} />
          <textarea required placeholder="House no., street, area" aria-label="Address" value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} className={`${field} min-h-20 sm:col-span-2`} />
          <input required placeholder="City" aria-label="City" value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} className={field} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.isDefault} onChange={(e) => setEdit({ ...edit, isDefault: e.target.checked })} className="accent-[#7a2a38]" /> Default address</label>
          <div className="flex gap-3 sm:col-span-2">
            <button className="rounded-full bg-wine-700 px-6 py-2.5 text-sm text-white">Save address</button>
            <button type="button" onClick={() => setEdit(null)} className="rounded-full border border-wine-100 px-6 py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
