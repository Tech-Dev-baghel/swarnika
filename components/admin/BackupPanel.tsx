"use client";

import { useRef, useState } from "react";

export default function BackupPanel() {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState<File | null>(null);
  const restore = async () => {
    if (!confirm) return;
    try {
      const data = JSON.parse(await confirm.text());
      const r = await fetch("/api/admin/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      setMsg(r.ok ? { ok: true, text: "Restored. The website now shows the data from that backup." } : { ok: false, text: j.error ?? "Restore failed" });
    } catch { setMsg({ ok: false, text: "That file isn't valid JSON." }); }
    setConfirm(null);
    if (file.current) file.current.value = "";
  };
  return (
    <div>
      <h1 className="font-display text-4xl text-stone-900">Backup & Restore</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500">Download a copy of your store data — products, rates, orders, pages, reviews, subscribers and settings — and keep it somewhere safe. Customer and staff passwords are never included. Uploaded photos stay in the database (Neon also keeps its own automatic backups).</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-display text-2xl">Download backup</h2>
          <p className="mt-1 text-sm text-stone-500">A single .json file. Do this weekly.</p>
          <a href="/api/admin/backup" className="mt-4 inline-block rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white">Download now</a>
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-display text-2xl">Restore from backup</h2>
          <p className="mt-1 text-sm text-stone-500">Replaces the current store data with the file you choose.</p>
          <input ref={file} type="file" accept="application/json,.json" onChange={(e) => setConfirm(e.target.files?.[0] ?? null)} className="mt-4 block w-full max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2" aria-label="Backup file" />
          {confirm && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              This will overwrite current data with <b>{confirm.name}</b>.
              <div className="mt-2 flex gap-2">
                <button onClick={restore} className="rounded-lg bg-red-600 px-3 py-1.5 text-white">Yes, restore</button>
                <button onClick={() => { setConfirm(null); if (file.current) file.current.value = ""; }} className="rounded-lg border border-red-200 px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}
          {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}
        </section>
      </div>
    </div>
  );
}
