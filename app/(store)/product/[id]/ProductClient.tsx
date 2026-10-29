"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import Photo from "@/components/Photo";
import ProductCard from "@/components/ProductCard";
import { Reveal, Stagger, StaggerItem } from "@/components/Motion";
import { HeartIcon, PinIcon, ShieldIcon, StarIcon, SwapIcon, TruckIcon, VideoIcon } from "@/components/Icons";
import { useData } from "@/lib/data-context";
import { inr, rateFor } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { METAL_LABEL, STONE_LABEL, type Metal, type Stone } from "@/lib/types";

const SIZES: Record<string, string[]> = {
  ring: ["8", "10", "12", "14", "16", "18", "20"],
  bangle: ["2.2", "2.4", "2.6", "2.8"],
};

function ZoomImage({ src, alt, fb }: { src: string; alt: string; fb: { kind: string; metal: Metal; stone: Stone } }) {
  const [origin, setOrigin] = useState("50% 50%");
  const [zoom, setZoom] = useState(false);
  return (
    <div
      className="relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl bg-gold-100"
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); }}
      onMouseEnter={() => setZoom(true)} onMouseLeave={() => setZoom(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div key={src} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
          <Photo src={src} alt={alt} w={1200} eager className="h-full w-full" fallback={fb}
            imgClassName={`transition-transform duration-300 ${zoom ? "scale-[1.8]" : "scale-100"}`} imgStyle={{ transformOrigin: origin }} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function ProductClient({ id }: { id: string }) {
  const { getProduct, products, breakup, rates, catLabel } = useData();
  const p = getProduct(id)!;
  const { addToCart, toggleWish, wishlist, setStoreOpen } = useStore();
  const sizes = SIZES[p.category];
  const [size, setSize] = useState<string | undefined>(sizes?.[2]);
  const [view, setView] = useState(0);
  const [pin, setPin] = useState("");
  const [eta, setEta] = useState<string | null>(null);
  const b = breakup(p);
  const wished = wishlist.includes(p.id);
  const similar = products.filter((x) => x.id !== p.id && (x.category === p.category || x.collection === p.collection)).slice(0, 4);
  const fb = { kind: p.category, metal: p.metal, stone: p.stone };
  const images = p.images.length ? p.images : [""];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="text-xs uppercase tracking-widest text-ink/50">
        <Link href="/" className="hover:text-wine-700">Home</Link> / <Link href={`/shop?category=${p.category}`} className="hover:text-wine-700">{catLabel(p.category)}</Link> / <span className="text-ink/70">{p.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="lg:sticky lg:top-36 lg:self-start">
          <div className="relative">
            <ZoomImage src={images[view]} alt={p.name} fb={fb} />
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleWish(p.id)} aria-label="Toggle wishlist" className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white shadow ${wished ? "text-wine-700" : "text-ink/50"}`}><HeartIcon filled={wished} /></motion.button>
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.map((src, i) => (
                <button key={src + i} onClick={() => setView(i)} aria-label={`View image ${i + 1}`} className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${view === i ? "border-gold-500" : "border-transparent opacity-70 hover:opacity-100"}`}>
                  <Photo src={src} alt="" w={300} className="h-full w-full" fallback={fb} />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
          {[
            <p key="c" className="text-xs uppercase tracking-[0.3em] text-gold-600">{p.collection} Collection</p>,
            <h1 key="h" className="mt-2 font-display text-4xl text-wine-800 md:text-5xl">{p.name}</h1>,
            <div key="r" className="mt-2 flex items-center gap-2 text-sm text-ink/60">
              <span className="flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-gold-600"><StarIcon className="h-3.5 w-3.5" />{p.rating}</span>
              {p.reviews} reviews · SKU {p.id.toUpperCase()}
            </div>,
            <div key="p" className="mt-6">
              <p className="text-3xl font-semibold text-wine-800">{inr(b.total)}</p>
              <p className="text-xs text-ink/50">Incl. of all taxes. Based on today&apos;s {p.purity} rate of {inr(rateFor(rates, p.purity))}/g.</p>
              {p.stock > 0 && p.stock <= 3 && <p className="mt-2 text-xs font-medium text-wine-700">Only {p.stock} left</p>}
            </div>,
            p.description ? <p key="d" className="mt-5 text-sm leading-relaxed text-ink/70">{p.description}</p> : null,
          ].filter(Boolean).map((el, i) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>{el}</motion.div>
          ))}

          {sizes && (
            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">{p.category === "ring" ? "Ring size" : "Bangle size"}</p>
                <Link href="/#guide" className="text-xs text-wine-700 underline">Size guide</Link>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`relative h-10 min-w-10 rounded-full border px-3 text-sm transition-colors ${size === s ? "border-wine-700 text-white" : "border-wine-100 bg-white hover:border-gold-400"}`}>
                    {size === s && <motion.span layoutId="size-pill" className="absolute inset-0 rounded-full bg-wine-700" />}
                    <span className="relative">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} onClick={() => addToCart(p.id, size)} className="shine flex-1 rounded-full bg-wine-700 py-3.5 text-sm font-medium text-white hover:bg-wine-800">Add to bag</motion.button>
            <button onClick={() => setStoreOpen(true)} className="flex items-center gap-2 rounded-full border border-wine-700 px-5 text-sm text-wine-700"><PinIcon className="h-4 w-4" /><span className="hidden sm:inline">Check in store</span></button>
          </div>
          <button onClick={() => setStoreOpen(true)} className="mt-3 flex items-center gap-2 text-sm text-wine-700 hover:underline"><VideoIcon className="h-4 w-4" />See it live on a video call</button>

          <form onSubmit={(e) => { e.preventDefault(); setEta(/^\d{6}$/.test(pin) ? `Usually delivered in 3–7 days to ${pin} · Free insured shipping` : "Please enter a valid 6-digit pincode"); }} className="mt-6 flex overflow-hidden rounded-full border border-wine-100 bg-white">
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Enter pincode for delivery date" aria-label="Pincode" className="w-full bg-transparent px-5 py-3 text-sm outline-none" />
            <button className="px-5 text-sm font-medium text-wine-700">Check</button>
          </form>
          <AnimatePresence>{eta && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xs text-ink/60">{eta}</motion.p>}</AnimatePresence>

          <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-ink/70">
            <div className="rounded-xl bg-white p-3"><ShieldIcon className="mx-auto h-5 w-5 text-gold-500" /><p className="mt-1">BIS Hallmarked</p></div>
            <div className="rounded-xl bg-white p-3"><SwapIcon className="mx-auto h-5 w-5 text-gold-500" /><p className="mt-1">Lifetime Exchange</p></div>
            <div className="rounded-xl bg-white p-3"><TruckIcon className="mx-auto h-5 w-5 text-gold-500" /><p className="mt-1">15-day Returns</p></div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-600">Product details</p>
              <dl className="space-y-1.5 text-sm">
                {[["Metal", `${p.purity} ${METAL_LABEL[p.metal]}`], ["Gross weight", `${p.weight} g`], ["Stone", p.stone === "none" ? "—" : STONE_LABEL[p.stone]], ["Occasion", p.occasion], ["For", p.gender]].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-wine-100 pb-1.5"><dt className="text-ink/60">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-600">Price breakup</p>
              <dl className="space-y-1.5 text-sm">
                {([["Metal value", b.metalValue], ["Making charges", b.making], ["Stone value", b.stoneValue], ["GST (3%)", b.gst]] as const).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-wine-100 pb-1.5"><dt className="text-ink/60">{k}</dt><dd>{inr(v)}</dd></div>
                ))}
                <div className="flex justify-between pt-1 font-semibold text-wine-800"><dt>Total</dt><dd>{inr(b.total)}</dd></div>
              </dl>
            </div>
          </div>
        </motion.div>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <Reveal><h2 className="font-display text-3xl text-wine-800">You may also like</h2></Reveal>
          <Stagger className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{similar.map((x) => <StaggerItem key={x.id}><ProductCard p={x} /></StaggerItem>)}</Stagger>
        </section>
      )}
    </div>
  );
}
