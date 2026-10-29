import Link from "next/link";
import Photo from "@/components/Photo";
import { Reveal, Stagger, StaggerItem } from "@/components/Motion";
import { getPublicData } from "@/lib/db";

export const metadata = { title: "Collections — Swarnika Jewels" };

export default async function Collections() {
  const { collections, products, categories } = await getPublicData();
  const count = (name: string) => products.filter((p) => p.collection === name).length;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Reveal className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-gold-600">Signature</p>
        <h1 className="mt-2 font-display text-5xl text-wine-800">Our Collections</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/60">Each collection tells its own story — from temple craft to featherlight everyday gold.</p>
      </Reveal>
      <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map((c) => (
          <StaggerItem key={c.id}>
            <Link href={`/shop?collection=${encodeURIComponent(c.name)}`} className="group relative block aspect-[3/4] overflow-hidden rounded-3xl">
              <Photo src={c.image} alt={c.name} w={700} className="absolute inset-0" imgClassName="transition-transform duration-[1.2s] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 via-wine-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                <p className="font-display text-3xl">{c.name}</p>
                <p className="text-sm text-gold-200">{c.blurb}</p>
                <p className="mt-2 text-xs uppercase tracking-widest">{count(c.name)} designs →</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
      <Reveal className="mt-16">
        <h2 className="font-display text-3xl text-wine-800">Shop by category</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => <Link key={c.id} href={`/shop?category=${c.slug}`} className="rounded-full border border-wine-100 bg-white px-4 py-2 text-sm hover:border-gold-400">{c.label}</Link>)}
        </div>
      </Reveal>
    </div>
  );
}
