"use client";

import { useRef, useState } from "react";
import { img } from "@/lib/pricing";

export type FieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "url"; required?: boolean; placeholder?: string; help?: string; wide?: boolean }
  | { key: string; label: string; type: "number"; required?: boolean; step?: number; min?: number; help?: string; wide?: boolean }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; required?: boolean; help?: string; wide?: boolean }
  | { key: string; label: string; type: "checkbox"; help?: string; wide?: boolean }
  | { key: string; label: string; type: "multi"; options: { value: string; label: string }[]; help?: string; wide?: boolean }
  | { key: string; label: string; type: "image"; help?: string; wide?: boolean }
  | { key: string; label: string; type: "images"; help?: string; wide?: boolean };

export const inputCls = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20";

async function upload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? "Upload failed");
  return j.url;
}

function Thumb({ src, onRemove, onLeft, onRight }: { src: string; onRemove: () => void; onLeft?: () => void; onRight?: () => void }) {
  return (
    <div className="group relative h-24 w-24 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img(src, 200)} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-1 transition hover-reveal">
        <span className="flex gap-1">
          {onLeft && <button type="button" onClick={onLeft} className="rounded bg-white/90 px-2 py-1 text-xs" aria-label="Move left">◀</button>}
          {onRight && <button type="button" onClick={onRight} className="rounded bg-white/90 px-2 py-1 text-xs" aria-label="Move right">▶</button>}
        </span>
        <button type="button" onClick={onRemove} className="rounded bg-red-600 px-2 py-1 text-xs text-white" aria-label="Remove image">✕</button>
      </div>
    </div>
  );
}

export function ImagesInput({ value, onChange, multiple }: { value: string[]; onChange: (v: string[]) => void; multiple: boolean }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const add = (u: string[]) => onChange(multiple ? [...value, ...u] : u.slice(-1));
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setErr("");
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await upload(f));
      add(urls);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const move = (i: number, d: number) => { const v = [...value]; const [x] = v.splice(i, 1); v.splice(i + d, 0, x); onChange(v); };
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
      className="rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-3"
    >
      <div className="flex flex-wrap gap-2">
        {value.filter(Boolean).map((v, i) => (
          <Thumb key={v + i} src={v} onRemove={() => onChange(value.filter((_, j) => j !== i))}
            onLeft={multiple && i > 0 ? () => move(i, -1) : undefined} onRight={multiple && i < value.length - 1 ? () => move(i, 1) : undefined} />
        ))}
        <button type="button" onClick={() => fileRef.current?.click()} className="grid h-24 w-24 place-items-center rounded-lg border border-stone-300 bg-white text-center text-xs text-stone-500 hover:border-amber-600 hover:text-amber-700">
          {busy ? "Uploading…" : <span>＋<br />Upload</span>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>
      <div className="mt-2 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className={inputCls} />
        <button type="button" onClick={() => { if (url.trim()) { add([url.trim()]); setUrl(""); } }} className="rounded-lg bg-stone-800 px-3 text-sm text-white">Add</button>
      </div>
      <p className="mt-1 text-xs text-stone-500">{multiple ? "First image is the main photo. Drag files here, upload, or paste links." : "Drag a file here, upload, or paste a link."}</p>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export function FieldInput({ f, value, onChange }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  switch (f.type) {
    case "textarea":
      return <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} required={f.required} placeholder={f.placeholder} className={`${inputCls} min-h-24`} />;
    case "number":
      return <input type="number" value={value === undefined || value === null ? "" : String(value)} step={f.step ?? "any"} min={f.min} required={f.required} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />;
    case "select":
      return (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} required={f.required} className={inputCls}>
          {!f.required && <option value="">—</option>}
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "checkbox":
      return (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-amber-700" /> Yes
        </label>
      );
    case "multi": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {f.options.map((o) => {
            const on = arr.includes(o.value);
            return (
              <button type="button" key={o.value} onClick={() => onChange(on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
                className={`rounded-full border px-3 py-1 text-xs ${on ? "border-amber-700 bg-amber-700 text-white" : "border-stone-300 bg-white"}`}>{o.label}</button>
            );
          })}
        </div>
      );
    }
    case "image":
      return <ImagesInput value={value ? [String(value)] : []} onChange={(v) => onChange(v[0] ?? "")} multiple={false} />;
    case "images":
      return <ImagesInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} multiple />;
    default:
      return <input type={f.type === "url" ? "text" : "text"} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} required={f.required} placeholder={f.placeholder} className={inputCls} />;
  }
}
