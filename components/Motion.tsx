"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children into view once, as they scroll in. */
export function Reveal({ children, delay = 0, y = 28, className = "" }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Grid/list whose direct <StaggerItem> children animate in one after another. */
export function Stagger({ children, className = "", gap = 0.08 }: { children: React.ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 24, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease } } }}
    >
      {children}
    </motion.div>
  );
}

/** Image block that drifts slightly slower than the page as you scroll. */
export function Parallax({ children, className = "", amount = 60 }: { children: React.ReactNode; className?: string; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-amount, amount]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[60px] h-[calc(100%+120px)]">{children}</motion.div>
    </div>
  );
}

export function Marquee({ text }: { text: string }) {
  const parts = text.split("·").map((t) => t.trim()).filter(Boolean);
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {parts.map((t, i) => (
        <span key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-2xl text-wine-800 md:text-3xl">
          {t}<span className="text-base text-gold-500">◆</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-gold-200 bg-gold-100/60 py-5" aria-label={parts.join(", ")}>
      <div className="animate-marquee flex w-max" aria-hidden="true">{row}{row}</div>
    </div>
  );
}
