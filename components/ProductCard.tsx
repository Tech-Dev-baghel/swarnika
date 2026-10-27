"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useData } from "@/lib/data-context";
import { inr } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { METAL_LABEL, type Product } from "@/lib/types";
import Photo from "./Photo";
import { HeartIcon, StarIcon } from "./Icons";

const TAG_LABEL = { bestseller: "Bestseller", new: "New", trending: "Trending" } as const;

export default function ProductCard({ p }: { p: Product }) {
  const { wishlist, toggleWish, addToCart } = useStore();
  const { price } = useData();
  const wished = wishlist.includes(p.id);
  const fb = { kind: p.category, metal: p.metal, stone: p.stone };
  const second = p.images[1];
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-wine-100/70 bg-white shadow-sm transition-shadow hover:shadow-soft"
    >
      <Link href={`/product/${p.id}`} className="shine relative block aspect-square bg-gold-100" aria-label={p.name}>
        <Photo src={p.images[0]} alt={p.name} w={600} fallback={fb} className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-110" />
        {second && (
          <Photo src={second} alt="" w={600} fallback={fb} className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" imgClassName="scale-105" />
        )}
        {p.tags[0] && (
          <span className="absolute left-3 top-3 rounded-full bg-wine-800/90 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-gold-100 backdrop-blur">{TAG_LABEL[p.tags[0]]}</span>
        )}
        {p.stock === 0 && <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-wine-800">Made to order</span>}
      </Link>
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => toggleWish(p.id)}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow backdrop-blur ${wished ? "text-wine-700" : "text-ink/50 hover:text-wine-700"}`}
      >
        <HeartIcon filled={wished} />
      </motion.button>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] uppercase tracking-widest text-gold-600">{p.purity} · {METAL_LABEL[p.metal]}</p>
        <Link href={`/product/${p.id}`} className="mt-1 line-clamp-1 font-medium text-ink hover:text-wine-700">{p.name}</Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-ink/60">
          <StarIcon className="h-3.5 w-3.5 text-gold-500" /> {p.rating} <span>({p.reviews})</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-sm font-semibold text-wine-800 sm:text-base">{inr(price(p))}</span>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => addToCart(p.id)} className="whitespace-nowrap rounded-full border border-wine-700 px-3 py-1 text-xs font-medium text-wine-700 transition-colors hover:bg-wine-700 hover:text-white">
            <span className="sm:hidden">Add</span><span className="hidden sm:inline">Add to bag</span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
