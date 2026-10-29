"use client";

import Link from "next/link";
import { AnimatePresence, motion, animate, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useData } from "@/lib/data-context";
import { inr } from "@/lib/pricing";
import type { Tag } from "@/lib/types";
import Photo from "./Photo";
import ProductCard from "./ProductCard";
import { ChevronIcon } from "./Icons";

const ease = [0.22, 1, 0.36, 1] as const;
const DURATION = 6500;

export function HeroCarousel() {
  const { slides } = useData();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  useEffect(() => {
    if (paused || n < 2) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % n), DURATION);
    return () => window.clearTimeout(t);
  }, [i, paused, n]);
  if (!n) return null;
  const s = slides[i % n];
  return (
    <section className="relative h-[560px] overflow-hidden bg-wine-900 md:h-[620px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="Featured collections">
      <AnimatePresence initial={false}>
        <motion.div key={s.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease }}>
          <motion.div className="absolute inset-0" initial={{ scale: 1.15 }} animate={{ scale: 1.02 }} transition={{ duration: DURATION / 1000 + 1.5, ease: "linear" }}>
            <Photo src={s.image} alt={s.title} w={1920} eager className="h-full w-full" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-wine-900/85 via-wine-900/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-wine-900/50 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-6">
        <AnimatePresence mode="wait">
          <motion.div key={s.id} className="max-w-xl text-ivory" initial="hidden" animate="show" exit="exit"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } }, exit: { opacity: 0, transition: { duration: 0.3 } } }}>
            <motion.p variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }} className="text-xs uppercase tracking-[0.35em] text-gold-200">{s.eyebrow}</motion.p>
            <motion.h1 variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } }} className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl md:text-7xl">{s.title}</motion.h1>
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}>
              <Link href={s.href} className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3 text-sm font-medium text-wine-900 transition-colors hover:bg-gold-200">
                {s.cta} <ChevronIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {n > 1 && (
        <>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((x, idx) => (
              <button key={x.id} onClick={() => setI(idx)} aria-label={`Show slide ${idx + 1}`} className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/30">
                {idx === i && (
                  <motion.span key={`${i}-${paused}`} className="absolute inset-y-0 left-0 bg-gold-400" initial={{ width: paused ? "100%" : "0%" }} animate={{ width: "100%" }} transition={{ duration: paused ? 0 : DURATION / 1000, ease: "linear" }} />
                )}
              </button>
            ))}
          </div>
          <button onClick={() => setI((i - 1 + n) % n)} aria-label="Previous slide" className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur transition-colors hover:bg-white/30 md:block"><ChevronIcon className="h-5 w-5 rotate-180" /></button>
          <button onClick={() => setI((i + 1) % n)} aria-label="Next slide" className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur transition-colors hover:bg-white/30 md:block"><ChevronIcon className="h-5 w-5" /></button>
        </>
      )}
    </section>
  );
}

/** Number that counts up when it scrolls into view. */
export function CountUp({ value, format = (v: number) => inr(v) }: { value: number; format?: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: 1.4, ease });
    return () => c.stop();
  }, [inView, value, mv]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

export function GoldRateCard() {
  const { rates, settings } = useData();
  return (
    <div className="rounded-3xl border border-gold-200 bg-white p-6 shadow-soft">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl text-wine-800">Today&apos;s Gold Rate</h3>
        <span className="text-right text-xs text-ink/50">{settings.rateCity} · {settings.rateUpdated}</span>
      </div>
      <ul className="mt-4 divide-y divide-wine-100">
        {rates.map((r) => (
          <li key={r.purity} className="flex items-center justify-between py-3 text-sm">
            <span>{r.label}</span>
            <span className="flex items-center gap-3">
              <span className="font-semibold text-wine-800"><CountUp value={r.perGram} />/g</span>
              <span className={`w-14 text-right text-xs ${r.change >= 0 ? "text-emerald-700" : "text-red-700"}`}>{r.change >= 0 ? "▲" : "▼"} {Math.abs(r.change)}%</span>
            </span>
          </li>
        ))}
      </ul>
      <Link href="/gold-rate" className="mt-3 inline-flex items-center gap-1 text-sm text-wine-700 hover:underline">Rates by city <ChevronIcon className="h-3.5 w-3.5" /></Link>
    </div>
  );
}

export function SavingsCalculator() {
  const { settings } = useData();
  const [monthly, setMonthly] = useState(5000);
  const months = 10;
  const paid = monthly * months;
  const bonus = Math.round((monthly * settings.savingsBonusPct) / 100);
  return (
    <div className="relative grid gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-wine-800 to-wine-900 p-8 text-ivory md:grid-cols-2 md:p-12">
      <motion.div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 8, repeat: Infinity }} />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.35em] text-gold-200">{settings.brandName} Savings Plan</p>
        <h2 className="mt-3 font-display text-4xl">Save monthly, buy jewellery with a bonus</h2>
        <p className="mt-4 text-sm text-ivory/70">Pay a fixed amount for {months} months. We add {settings.savingsBonusPct}% of one instalment as a bonus, to redeem on any jewellery at a {settings.brandName} store.</p>
      </div>
      <div className="relative rounded-2xl bg-white/10 p-6 backdrop-blur">
        <label htmlFor="emi" className="text-sm text-ivory/80">Monthly instalment</label>
        <p className="mt-1 font-display text-4xl text-gold-200">{inr(monthly)}</p>
        <input id="emi" type="range" min={1000} max={50000} step={500} value={monthly} onChange={(e) => setMonthly(+e.target.value)} className="mt-4 w-full accent-[#cfa45a]" />
        <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-3 sm:gap-3 sm:text-center">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 p-3 sm:block"><dt className="text-ivory/60">You pay</dt><dd className="font-semibold sm:mt-1">{inr(paid)}</dd></div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 p-3 sm:block"><dt className="text-ivory/60">Our bonus</dt><dd className="font-semibold text-gold-200 sm:mt-1">+{inr(bonus)}</dd></div>
          <motion.div key={paid} initial={{ scale: 0.94 }} animate={{ scale: 1 }} className="flex items-center justify-between gap-2 rounded-xl bg-gold-400 p-3 text-wine-900 sm:block"><dt>Redeem</dt><dd className="font-semibold sm:mt-1">{inr(paid + bonus)}</dd></motion.div>
        </dl>
      </div>
    </div>
  );
}

export function ProductTabs() {
  const { products } = useData();
  const tabs: { key: Tag; label: string }[] = [
    { key: "trending", label: "Trending" }, { key: "new", label: "New Arrivals" }, { key: "bestseller", label: "Bestsellers" },
  ];
  const [t, setT] = useState<Tag>(tabs[0].key);
  const list = products.filter((p) => p.tags.includes(t)).slice(0, 8);
  return (
    <div>
      <div className="flex justify-center gap-2">
        {tabs.map((x) => (
          <button key={x.key} onClick={() => setT(x.key)} className={`relative rounded-full px-5 py-2 text-sm transition-colors ${t === x.key ? "text-white" : "bg-white text-ink/70 hover:text-wine-700"}`}>
            {t === x.key && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-wine-700" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className="relative">{x.label}</span>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="mt-8 text-center text-sm text-ink/50">No designs in this edit yet — tag products as {tabs.find((x) => x.key === t)?.label} in the admin panel.</p>}
      <motion.div layout className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div key={`${t}-${p.id}`} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease } }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}>
              <ProductCard p={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
