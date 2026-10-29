"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { useEscape } from "@/lib/hooks";
import { inr, priceBreakup } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { CONFIGS, type Extra } from "./configs";
import { FieldInput } from "./fields";

type Row = Record<string, unknown> & { id: string };

export default function ResourceManager({ kind, initial, extra }: { kind: string; initial: Row[]; extra: Extra }) {
  const cfg = CONFIGS[kind];
  const [rows, setRows] = useState<Row[]>(initial);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ row: Record<string, unknown>; isNew: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [flash, setFlash] = useState("");
  useEscape(!!edit, useCallback(() => setEdit(null), []));

  const fields = cfg.fields(extra);
  const shown = useMemo(() => {
    let r = rows;
    if (q) r = r.filter((x) => cfg.search.some((k) => String(x[k] ?? "").toLowerCase().includes(q.toLowerCase())));
    if (cfg.sortable) r = [...r].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
    return r;
  }, [rows, q, cfg]);

  const note = (m: string) => { setFlash(m); window.setTimeout(() => setFlash(""), 2500); };
  const open = (row: Row | null) => {
    setErr(""); setConfirmDel(false);
    setEdit(row ? { row: structuredClone(row), isNew: false } : { row: cfg.defaults(extra), isNew: true });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setBusy(true); setErr("");
    const body = { ...edit.row };
    for (const f of fields) if (f.type === "number" && body[f.key] === "") body[f.key] = 0;
    if (kind === "categories" && typeof body.slug === "string") body.slug = body.slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (kind === "coupons" && typeof body.code === "string") body.code = body.code.trim().toUpperCase();
    const r = await fetch(`/api/admin/${cfg.resource}`, { method: edit.isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "Could not save"); return; }
    setRows((rs) => (edit.isNew ? [j, ...rs] : rs.map((x) => (x.id === j.id ? j : x))));
    setEdit(null);
    note(edit.isNew ? `New ${cfg.singular} added — it's live on the site.` : "Saved — the website is updated.");
  };

  const remove = async () => {
    if (!edit || edit.isNew) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    setBusy(true);
    const r = await fetch(`/api/admin/${cfg.resource}?id=${encodeURIComponent(String(edit.row.id))}`, { method: "DELETE" });
    setBusy(false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error ?? "Could not delete"); setConfirmDel(false); return; }
    setRows((rs) => rs.filter((x) => x.id !== edit.row.id));
    setEdit(null);
    note("Deleted.");
  };

  const quickToggle = async (row: Row, key: string) => {
    const next = { ...row, [key]: !row[key] };
    setRows((rs) => rs.map((x) => (x.id === row.id ? next : x)));
    await fetch(`/api/admin/${cfg.resource}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, [key]: next[key] }) });
  };

  const preview = kind === "products" && edit ? priceBreakup(edit.row as unknown as Product, extra.rates) : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-stone-900">{cfg.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">{cfg.description}</p>
        </div>
        <button onClick={() => open(null)} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-800">＋ Add {cfg.singular}</button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.title.toLowerCase()}…`} className="w-full max-w-sm rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-600" />
        <span className="text-sm text-stone-500">{shown.length} of {rows.length}</span>
        <AnimatePresence>{flash && <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">{flash}</motion.span>}</AnimatePresence>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr>{cfg.columns.map((c, i) => <th key={i} className={`px-4 py-3 font-medium ${c.className ?? ""}`}>{c.label}</th>)}<th className="px-4 py-3" /></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-amber-50/40" onClick={() => open(r)}>
                {cfg.columns.map((c, i) => <td key={i} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>{c.render(r, extra)}</td>)}
                <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {"active" in r && <button onClick={() => quickToggle(r, "active")} className="mr-3 text-xs text-stone-500 hover:text-stone-900">{r.active ? "Hide" : "Show"}</button>}
                  {kind === "products" && <button onClick={() => setEdit({ row: { ...structuredClone(r), id: undefined, name: `${r.name} (copy)` }, isNew: true })} className="mr-3 text-xs text-stone-500 hover:text-stone-900">Duplicate</button>}
                  <button onClick={() => open(r)} className="text-xs font-medium text-amber-700 hover:underline">Edit</button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={cfg.columns.length + 1} className="px-4 py-10 text-center text-stone-500">Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {edit && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/40" onClick={() => setEdit(null)} />
            <motion.form
              onSubmit={save}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
                <h2 className="font-display text-2xl">{edit.isNew ? `New ${cfg.singular}` : `Edit ${cfg.singular}`}</h2>
                <button type="button" onClick={() => setEdit(null)} className="text-2xl leading-none text-stone-400 hover:text-stone-700" aria-label="Close">×</button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {preview && (
                  <div className="mb-5 grid grid-cols-5 gap-2 rounded-xl bg-amber-50 p-3 text-center text-xs text-stone-600">
                    <div><p>Metal</p><p className="font-medium text-stone-900">{inr(preview.metalValue)}</p></div>
                    <div><p>Making</p><p className="font-medium text-stone-900">{inr(preview.making)}</p></div>
                    <div><p>Stone</p><p className="font-medium text-stone-900">{inr(preview.stoneValue)}</p></div>
                    <div><p>GST 3%</p><p className="font-medium text-stone-900">{inr(preview.gst)}</p></div>
                    <div><p>Price</p><p className="font-semibold text-amber-800">{inr(preview.total)}</p></div>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((f) => (
                    <label key={f.key} className={`block ${f.wide || f.type === "images" || f.type === "image" || f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-500">{f.label}</span>
                      <FieldInput f={f} value={edit.row[f.key]} onChange={(v) => setEdit((s) => (s ? { ...s, row: { ...s.row, [f.key]: v } } : s))} />
                      {f.help && <span className="mt-1 block text-xs text-stone-400">{f.help}</span>}
                    </label>
                  ))}
                </div>
                {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-6 py-4">
                {!edit.isNew ? (
                  <button type="button" onClick={remove} disabled={busy} className={`rounded-lg px-3 py-2 text-sm ${confirmDel ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-50"}`}>{confirmDel ? "Click again to delete" : "Delete"}</button>
                ) : <span />}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEdit(null)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm">Cancel</button>
                  <button disabled={busy} className="rounded-lg bg-amber-700 px-5 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
                </div>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
