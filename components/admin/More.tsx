"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inr } from "@/lib/pricing";
import type { AdminUser, Customer, Message, Page, Review, Role } from "@/lib/types";
import { inputCls } from "./fields";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");
const send = (url: string, method: string, body?: unknown) =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

export function Title({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-4xl text-stone-900">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-stone-500">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

const PILL: Record<string, string> = {
  new: "bg-amber-100 text-amber-800", pending: "bg-amber-100 text-amber-800", read: "bg-sky-100 text-sky-800", replied: "bg-emerald-100 text-emerald-800",
  approved: "bg-emerald-100 text-emerald-800", closed: "bg-stone-200 text-stone-600", rejected: "bg-stone-200 text-stone-600",
};

/* ---------------- messages ---------------- */
export function MessagesManager({ initial }: { initial: Message[] }) {
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("open");
  const set = async (m: Message, status: Message["status"]) => {
    setRows((r) => r.map((x) => (x.id === m.id ? { ...x, status } : x)));
    await send("/api/admin/messages", "PUT", { id: m.id, status });
  };
  const toggle = (m: Message) => { setOpen(open === m.id ? null : m.id); if (m.status === "new") set(m, "read"); };
  const shown = rows.filter((m) => filter === "all" || (filter === "open" ? m.status !== "closed" : m.status === filter));
  return (
    <div>
      <Title title="Messages" sub="Questions sent from the Contact page. Reply by email, phone or WhatsApp, then mark them replied or closed." />
      <div className="mt-6 flex flex-wrap gap-2">
        {["open", "new", "replied", "closed", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs capitalize ${filter === f ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}>{f}</button>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {shown.map((m) => (
          <li key={m.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <button onClick={() => toggle(m)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-stone-50">
              <span className={`h-2 w-2 rounded-full ${m.status === "new" ? "bg-amber-500" : "bg-transparent"}`} />
              <span className="font-medium">{m.name}</span>
              <span className="flex-1 truncate text-sm text-stone-500">{m.subject || m.body}</span>
              <span className="text-xs text-stone-400">{when(m.createdAt)}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${PILL[m.status]}`}>{m.status}</span>
            </button>
            {open === m.id && (
              <div className="border-t border-stone-100 p-4 text-sm">
                <p className="text-stone-500">{m.email && <a href={`mailto:${m.email}`} className="text-amber-700">{m.email}</a>} {m.phone && <> · <a href={`tel:${m.phone}`} className="text-amber-700">{m.phone}</a></>}</p>
                <p className="mt-3 whitespace-pre-wrap">{m.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.email && <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + (m.subject || "your message"))}`} className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs text-white">Reply by email</a>}
                  {m.phone && <a href={`https://wa.me/${m.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs text-white">WhatsApp</a>}
                  <button onClick={() => set(m, "replied")} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs">Mark replied</button>
                  <button onClick={() => set(m, "closed")} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs">Close</button>
                  <button onClick={async () => { await send(`/api/admin/messages?id=${m.id}`, "DELETE"); setRows((r) => r.filter((x) => x.id !== m.id)); }} className="rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
        {!shown.length && <li className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">No messages here.</li>}
      </ul>
    </div>
  );
}

/* ---------------- product reviews ---------------- */
export function ReviewsManager({ initial, names }: { initial: Review[]; names: Record<string, string> }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState("pending");
  const set = async (r: Review, status: Review["status"]) => {
    setRows((x) => x.map((y) => (y.id === r.id ? { ...y, status } : y)));
    await send("/api/admin/reviews", "PUT", { id: r.id, status });
  };
  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  return (
    <div>
      <Title title="Product Reviews" sub="Reviews written by signed-in customers. Only approved reviews appear on the product page." />
      <div className="mt-6 flex flex-wrap gap-2">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs capitalize ${filter === f ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}>
            {f} ({f === "all" ? rows.length : rows.filter((r) => r.status === f).length})
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-3">
        {shown.map((r) => (
          <li key={r.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-amber-600">{"★".repeat(r.rating)}<span className="text-stone-300">{"★".repeat(5 - r.rating)}</span></span>
              <span className="font-medium">{r.title || "Review"}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${PILL[r.status]}`}>{r.status}</span>
              <span className="ml-auto text-xs text-stone-400">{when(r.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm">{r.body}</p>
            <p className="mt-2 text-xs text-stone-500">{r.name} on <Link href={`/product/${r.productId}`} target="_blank" className="text-amber-700">{names[r.productId] ?? r.productId}</Link></p>
            <div className="mt-3 flex gap-2">
              {r.status !== "approved" && <button onClick={() => set(r, "approved")} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs text-white">Approve</button>}
              {r.status !== "rejected" && <button onClick={() => set(r, "rejected")} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs">Reject</button>}
              <button onClick={async () => { await send(`/api/admin/reviews?id=${r.id}`, "DELETE"); setRows((x) => x.filter((y) => y.id !== r.id)); }} className="rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Delete</button>
            </div>
          </li>
        ))}
        {!shown.length && <li className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">Nothing to review.</li>}
      </ul>
    </div>
  );
}

/* ---------------- customers ---------------- */
type CustRow = Customer & { orders: number; spent: number };
export function CustomersManager({ initial }: { initial: CustRow[] }) {
  const [q, setQ] = useState("");
  const ql = q.toLowerCase();
  const shown = initial.filter((c) => !ql || [c.name, c.email, c.phone].some((v) => String(v ?? "").toLowerCase().includes(ql)));
  const csv = () => {
    const rows = [["Name", "Email", "Phone", "Orders", "Spent", "Joined", "Last login", "Active"], ...initial.map((c) => [c.name, c.email ?? "", c.phone ?? "", c.orders, c.spent, c.createdAt.slice(0, 10), c.lastLogin?.slice(0, 10) ?? "", c.active ? "yes" : "no"])];
    const blob = new Blob(["﻿" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "customers.csv"; a.click();
  };
  return (
    <div>
      <Title title="Customers" sub="People who created an account on the website. Guest orders appear under Orders.">
        <button onClick={csv} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">Download CSV</button>
      </Title>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" aria-label="Search customers" className={`${inputCls} mt-6 max-w-md`} />
      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">Spent</th><th className="hidden px-4 py-3 md:table-cell">Joined</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.id} className="border-b border-stone-100 last:border-0 hover:bg-amber-50/40">
                <td className="px-4 py-3"><p className="font-medium">{c.name}</p>{!c.active && <span className="text-xs text-red-600">Disabled</span>}</td>
                <td className="px-4 py-3 text-stone-600">{c.email ?? "—"}<br /><span className="text-xs">{c.phone ?? ""}</span></td>
                <td className="px-4 py-3">{c.orders}</td>
                <td className="px-4 py-3">{inr(c.spent)}</td>
                <td className="hidden px-4 py-3 text-stone-500 md:table-cell">{c.createdAt.slice(0, 10)}</td>
                <td className="px-4 py-3 text-right"><Link href={`/admin/customers/${c.id}`} className="text-xs font-medium text-amber-700">View</Link></td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-stone-500">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CustomerActions({ c }: { c: Customer }) {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");
  const toggle = async () => { await send("/api/admin/customers", "PUT", { id: c.id, active: !c.active }); router.refresh(); };
  const reset = async () => {
    const r = await send("/api/admin/customers", "POST", { id: c.id });
    const j = await r.json(); if (r.ok) setLink(j.link); else setMsg(j.error);
  };
  return (
    <div className="flex flex-wrap items-start gap-2">
      <button onClick={reset} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">Create password reset link</button>
      <button onClick={toggle} className={`rounded-lg px-3 py-2 text-sm ${c.active ? "text-red-600 hover:bg-red-50" : "bg-emerald-700 text-white"}`}>{c.active ? "Disable account" : "Enable account"}</button>
      {link && (
        <div className="w-full rounded-lg bg-amber-50 p-3 text-xs">
          Send this link to the customer (works for 1 hour):
          <input readOnly value={link} onFocus={(e) => e.target.select()} className={`${inputCls} mt-1 font-mono text-xs`} />
          {c.phone && <a target="_blank" rel="noreferrer" href={`https://wa.me/91${c.phone}?text=${encodeURIComponent("Reset your password: " + link)}`} className="mt-2 inline-block text-emerald-700">Send on WhatsApp →</a>}
        </div>
      )}
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}

/* ---------------- staff ---------------- */
const ROLE_HELP: Record<Role, string> = {
  owner: "Everything, including staff accounts and backups",
  manager: "Everything except staff accounts and backups",
  staff: "Orders, appointments, messages, customers, products and reviews",
};
export function StaffManager({ initial, meId }: { initial: AdminUser[]; meId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "staff" as Role, password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");
  const call = async (method: string, body: unknown, url = "/api/admin/staff") => {
    setErr(""); setBusy(true);
    const r = await send(url, method, body); const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "Could not save"); return false; }
    router.refresh(); return true;
  };
  return (
    <div>
      <Title title="Staff & Roles" sub="Give each person their own login. Disable an account to block it immediately." />
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="hidden px-4 py-3 md:table-cell">Last sign-in</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
          <tbody>
            {initial.map((a) => (
              <tr key={a.id} className="border-b border-stone-100 last:border-0 align-top">
                <td className="px-4 py-3"><p className="font-medium">{a.name}{a.id === meId && <span className="ml-1 text-xs text-stone-400">(you)</span>}</p><p className="text-xs text-stone-500">{a.email}</p></td>
                <td className="px-4 py-3">
                  <select defaultValue={a.role} onChange={(e) => call("PUT", { id: a.id, role: e.target.value })} className="rounded-lg border border-stone-300 px-2 py-1 text-sm capitalize" aria-label={`Role for ${a.name}`}>
                    {(["owner", "manager", "staff"] as Role[]).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="hidden px-4 py-3 text-stone-500 md:table-cell">{when(a.lastLogin)}</td>
                <td className="px-4 py-3">{a.active ? <span className="text-emerald-700">Active</span> : <span className="text-red-600">Disabled</span>}</td>
                <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right text-xs">
                  <button onClick={() => { setPwFor(pwFor === a.id ? null : a.id); setNewPw(""); }} className="text-stone-600 hover:text-stone-900">Set password</button>
                  {a.id !== meId && <button onClick={() => call("PUT", { id: a.id, active: !a.active })} className="text-stone-600 hover:text-stone-900">{a.active ? "Disable" : "Enable"}</button>}
                  {a.id !== meId && <button onClick={() => call("DELETE", null, `/api/admin/staff?id=${a.id}`)} className="text-red-600">Delete</button>}
                  {pwFor === a.id && (
                    <div className="mt-2 flex gap-2">
                      <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" aria-label="New password" className={`${inputCls} w-40`} />
                      <button onClick={async () => { if (await call("PUT", { id: a.id, password: newPw })) setPwFor(null); }} className="rounded-lg bg-stone-900 px-3 text-white">Save</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={async (e) => { e.preventDefault(); if (await call("POST", form)) setForm({ name: "", email: "", role: "staff", password: "" }); }} className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-display text-2xl">Add a staff member</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input required placeholder="Full name" aria-label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          <input required type="email" placeholder="Email (used to sign in)" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className={inputCls} aria-label="Role">
            {(["staff", "manager", "owner"] as Role[]).map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)} — {ROLE_HELP[r]}</option>)}
          </select>
          <input required type="password" placeholder="Temporary password (8+ chars, letter + number)" aria-label="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
        </div>
        <button disabled={busy} className="mt-4 rounded-lg bg-amber-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">Add staff</button>
        <p className="mt-2 text-xs text-stone-500">Share the email and temporary password with them; they can change it under My Profile.</p>
      </form>
    </div>
  );
}

/* ---------------- my profile ---------------- */
export function ProfileForm({ me }: { me: AdminUser }) {
  const [name, setName] = useState(me.name);
  const [cur, setCur] = useState(""); const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const save = async (body: unknown) => {
    const r = await send("/api/admin/me", "PUT", body); const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? { ok: true, t: "Saved." } : { ok: false, t: j.error ?? "Could not save" });
    if (r.ok) { setCur(""); setPw(""); }
  };
  return (
    <div className="max-w-xl">
      <Title title="My Profile" sub={`Signed in as ${me.email} · ${me.role}`} />
      <form onSubmit={(e) => { e.preventDefault(); save({ name }); }} className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <label className="text-xs font-medium uppercase tracking-wider text-stone-500">Name<input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} mt-1`} /></label>
        <button className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white">Save name</button>
      </form>
      <form onSubmit={(e) => { e.preventDefault(); save({ current: cur, password: pw }); }} className="mt-4 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-display text-2xl">Change password</h2>
        <input type="password" required placeholder="Current password" aria-label="Current password" value={cur} onChange={(e) => setCur(e.target.value)} className={`${inputCls} mt-4`} />
        <input type="password" required placeholder="New password (8+ chars, letter + number)" aria-label="New password" value={pw} onChange={(e) => setPw(e.target.value)} className={`${inputCls} mt-3`} />
        <button className="mt-4 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white">Change password</button>
        <p className="mt-2 text-xs text-stone-500">Changing your password signs you out on other devices.</p>
      </form>
      {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.t}</p>}
    </div>
  );
}

/* ---------------- pages (CMS) ---------------- */
export function PagesManager({ initial }: { initial: Page[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Page | null>(initial[0] ?? null);
  const [draft, setDraft] = useState<Page | null>(initial[0] ?? null);
  const [msg, setMsg] = useState("");
  const pick = (p: Page | null) => { setSel(p); setDraft(p ?? { slug: "", title: "", body: "", updatedAt: "" }); setMsg(""); };
  const save = async () => {
    if (!draft) return;
    const r = await send("/api/admin/pages", "PUT", draft); const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Saved — live on the website." : j.error ?? "Could not save");
    if (r.ok) router.refresh();
  };
  const remove = async () => {
    if (!sel) return;
    const r = await send(`/api/admin/pages?slug=${sel.slug}`, "DELETE"); const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error); return; }
    router.refresh(); pick(null);
  };
  return (
    <div>
      <Title title="Pages" sub="Edit About, FAQ, Shipping, Returns, Privacy, Terms — or add your own page (it appears at /p/your-link)." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <ul className="space-y-1">
          {initial.map((p) => (
            <li key={p.slug}><button onClick={() => pick(p)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${sel?.slug === p.slug ? "bg-stone-900 text-white" : "bg-white hover:bg-stone-50"}`}>{p.title}<span className="block text-xs opacity-60">/{p.slug}</span></button></li>
          ))}
          <li><button onClick={() => pick(null)} className="w-full rounded-lg border border-dashed border-stone-300 px-3 py-2 text-left text-sm text-stone-600">＋ New page</button></li>
        </ul>
        {draft && (
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium uppercase tracking-wider text-stone-500">Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={`${inputCls} mt-1`} /></label>
              <label className="text-xs font-medium uppercase tracking-wider text-stone-500">Link name<input value={draft.slug} disabled={!!sel} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="e.g. gold-exchange" className={`${inputCls} mt-1 disabled:bg-stone-100`} /></label>
            </div>
            <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-stone-500">Content
              <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={`${inputCls} mt-1 min-h-[360px] font-mono text-xs normal-case tracking-normal`} />
            </label>
            <p className="mt-1 text-xs text-stone-500">Formatting: <code>## Heading</code> · <code>- bullet</code> · <code>**bold**</code> · <code>[link text](/url)</code> · blank line for a new paragraph.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={save} className="rounded-lg bg-amber-700 px-5 py-2 text-sm font-medium text-white">Save page</button>
              {sel && <a href={["about", "faq", "shipping", "returns", "privacy", "terms"].includes(sel.slug) ? `/${sel.slug}` : `/p/${sel.slug}`} target="_blank" className="text-sm text-amber-700">View ↗</a>}
              {sel && <button onClick={remove} className="ml-auto text-sm text-red-600">Delete page</button>}
              {msg && <span className="text-sm text-stone-600">{msg}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
