"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { Stagger, StaggerItem } from "@/components/Motion";
import { useData } from "@/lib/data-context";
import { useStore } from "@/lib/store";

export default function WishlistPage() {
  const { wishlist } = useStore();
  const { getProduct } = useData();
  const items = wishlist.map(getProduct).filter((p) => !!p);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-5xl text-wine-800">Wishlist</h1>
      <p className="mt-1 text-sm text-ink/60">{items.length} saved designs</p>
      {items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-gold-200 p-16 text-center">
          <p className="font-display text-3xl text-wine-800">Nothing saved yet</p>
          <p className="mt-2 text-ink/60">Tap the heart on any design to keep it here.</p>
          <Link href="/shop" className="mt-6 inline-block rounded-full bg-wine-700 px-7 py-3 text-sm text-white">Browse jewellery</Link>
        </div>
      ) : (
        <Stagger className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((p) => <StaggerItem key={p.id}><ProductCard p={p} /></StaggerItem>)}</Stagger>
      )}
    </div>
  );
}
