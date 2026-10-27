"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { useEscape } from "@/lib/hooks";
import ProductCard from "@/components/ProductCard";
import { CloseIcon } from "@/components/Icons";
import { useData } from "@/lib/data-context";
import { GENDERS, METAL_LABEL, OCCASIONS, STONE_LABEL, type Metal } from "@/lib/types";

const PRICES: [string, number | null, number | null][] = [
  ["Under ₹25,000", null, 25000], ["₹25,000 – ₹50,000", 25000, 50000], ["₹50,000 – ₹1,00,000", 50000, 100000], ["Above ₹1,00,000", 100000, null],
];

export default function ShopClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const { products, categories, catLabel, price } = useData();
  const [sort, setSort] = useState("featured");
  const [panel, setPanel] = useState(false);
  useEscape(panel, useCallback(() => setPanel(false), []));

  const facets = useMemo(() => ({
    category: { label: "Category", options: categories.map((c) => [c.slug, c.label]) as [string, string][] },
    metal: { label: "Metal", options: Object.entries(METAL_LABEL) as [string, string][] },
    stone: { label: "Stone", options: Object.entries(STONE_LABEL) as [string, string][] },
    occasion: { label: "Occasion", options: OCCASIONS.map((o) => [o, o]) as [string, string][] },
    gender: { label: "Gender", options: GENDERS.map((o) => [o, o]) as [string, string][] },
  }), [categories]);
  type FacetKey = keyof typeof facets;
  const keys = Object.keys(facets) as FacetKey[];

  const get = (k: string) => sp.get(k);
  const push = (n: URLSearchParams) => router.replace(`/shop${n.toString() ? "?" + n : ""}`, { scroll: false });
  const setParam = (k: string, v: string | null) => {
    const n = new URLSearchParams(sp.toString());
    if (v === null || n.get(k) === v) n.delete(k); else n.set(k, v);
    push(n);
  };
  const setPrice = (min: number | null, max: number | null) => {
    const n = new URLSearchParams(sp.toString());
    const same = n.get("min") === (min?.toString() ?? null) && n.get("max") === (max?.toString() ?? null);
    n.delete("min"); n.delete("max");
    if (!same) { if (min) n.set("min", String(min)); if (max) n.set("max", String(max)); }
    push(n);
  };

  const list = useMemo(() => {
    const q = get("q")?.toLowerCase();
    const min = Number(get("min") ?? 0), max = Number(get("max") ?? Infinity);
    let r = products.filter((p) => {
      const pr = price(p);
      return (!get("category") || p.category === get("category")) &&
        (!get("metal") || p.metal === get("metal")) &&
        (!get("stone") || p.stone === get("stone")) &&
        (!get("occasion") || p.occasion === get("occasion")) &&
        (!get("gender") || p.gender === get("gender") || (p.gender === "Unisex" && get("gender") !== "Kids")) &&
        (!get("collection") || p.collection === get("collection")) &&
        (!get("tag") || p.tags.includes(get("tag") as never)) &&
        pr >= min && pr <= max &&
        (!q || q.split(/\s+/).every((w) => (p.name + " " + catLabel(p.category) + " " + METAL_LABEL[p.metal] + " " + p.stone + " " + p.collection + " " + p.occasion).toLowerCase().includes(w.replace(/s$/, ""))));
    });
    if (sort === "low") r = [...r].sort((a, b) => price(a) - price(b));
    if (sort === "high") r = [...r].sort((a, b) => price(b) - price(a));
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "new") r = [...r].sort((a, b) => Number(b.tags.includes("new")) - Number(a.tags.includes("new")));
    return r;
  }, [sp, sort, products]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = keys.filter((k) => get(k)).map((k) => ({ k, label: facets[k].options.find(([v]) => v === get(k))?.[1] ?? get(k)! }));
  const title = get("q") ? `Results for “${get("q")}”` : get("category") ? catLabel(get("category")!) : get("collection") ? `${get("collection")} Collection` : get("metal") ? METAL_LABEL[get("metal") as Metal] : get("occasion") ?? "All Jewellery";

  const Filters = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-600">Price</p>
        <div className="space-y-1.5">
          {PRICES.map(([l, mn, mx]) => {
            const on = get("min") === (mn?.toString() ?? null) && get("max") === (mx?.toString() ?? null);
            return (
              <label key={l} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={on} onChange={() => setPrice(mn, mx)} className="accent-[#7a2a38]" />{l}
              </label>
            );
          })}
        </div>
      </div>
      {keys.map((k) => (
        <div key={k}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-600">{facets[k].label}</p>
          <div className="flex flex-wrap gap-2">
            {facets[k].options.map(([v, l]) => (
              <button key={v} onClick={() => setParam(k, v)} className={`rounded-full border px-3 py-1 text-xs transition-colors ${get(k) === v ? "border-wine-700 bg-wine-700 text-white" : "border-wine-100 bg-white hover:border-gold-400"}`}>{l}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink/50">Home / Shop</p>
          <h1 className="mt-1 font-display text-4xl text-wine-800 md:text-5xl">{title}</h1>
          <p className="mt-1 text-sm text-ink/60">{list.length} designs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPanel(true)} className="rounded-full border border-wine-700 px-4 py-2 text-sm text-wine-700 lg:hidden">Filters{active.length ? ` (${active.length})` : ""}</button>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by" className="rounded-full border border-wine-100 bg-white px-4 py-2 text-sm outline-none">
            <option value="featured">Featured</option>
            <option value="new">New arrivals</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </motion.div>

      {(active.length > 0 || get("min") || get("max") || get("q") || get("collection") || get("tag")) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {active.map((a) => (
            <button key={a.k} onClick={() => setParam(a.k, null)} className="flex items-center gap-1 rounded-full bg-gold-100 px-3 py-1 text-xs text-wine-800">{a.label}<CloseIcon className="h-3 w-3" /></button>
          ))}
          <button onClick={() => router.replace("/shop", { scroll: false })} className="text-xs text-wine-700 underline">Clear all</button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{Filters}</aside>
        <div>
          {list.length ? (
            <motion.div layout className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {list.map((p, i) => (
                  <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }} exit={{ opacity: 0, scale: 0.95 }}>
                    <ProductCard p={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gold-200 p-12 text-center">
              <p className="font-display text-2xl text-wine-800">No designs match these filters</p>
              <button onClick={() => router.replace("/shop")} className="mt-4 rounded-full bg-wine-700 px-5 py-2 text-sm text-white">See all jewellery</button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {panel && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={() => setPanel(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }} className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-ivory p-6">
              <div className="mb-4 flex items-center justify-between"><p className="font-display text-2xl text-wine-800">Filters</p><button onClick={() => setPanel(false)} aria-label="Close filters"><CloseIcon /></button></div>
              {Filters}
              <button onClick={() => setPanel(false)} className="mt-6 w-full rounded-full bg-wine-700 py-3 text-sm text-white">Show {list.length} designs</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
