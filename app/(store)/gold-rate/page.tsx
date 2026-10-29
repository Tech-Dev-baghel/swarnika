import Link from "next/link";
import { GoldRateCard } from "@/components/HomeWidgets";
import { Reveal } from "@/components/Motion";
import { getPublicData } from "@/lib/db";
import { inr } from "@/lib/pricing";

export const metadata = { title: "Today's Gold Rate — Swarnika Jewels" };

export default async function GoldRatePage() {
  const { rates, stores } = await getPublicData();
  const r22 = rates.find((r) => r.purity === "22KT")?.perGram ?? 0, r24 = rates.find((r) => r.purity === "24KT")?.perGram ?? 0;
  const cities = Array.from(new Set(stores.map((s) => s.city)));
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Reveal>
        <h1 className="font-display text-5xl text-wine-800">Today&apos;s Gold Rate</h1>
        <p className="mt-2 text-sm text-ink/60">Rates per gram for metal value only. Making charges and GST are added per design.</p>
      </Reveal>
      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <Reveal><GoldRateCard /></Reveal>
        <Reveal delay={0.1} className="overflow-hidden rounded-3xl border border-wine-100 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm [&_td]:px-3 [&_th]:px-3 sm:[&_td]:px-5 sm:[&_th]:px-5">
            <thead className="bg-gold-100 text-wine-800"><tr><th className="px-5 py-3">City</th><th className="px-5 py-3">22KT / g</th><th className="hidden px-5 py-3 sm:table-cell">24KT / g</th><th className="px-5 py-3">22KT / 10 g</th></tr></thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c} className="border-t border-wine-100 transition-colors hover:bg-ivory"><td className="px-5 py-3">{c}</td><td className="px-5 py-3">{inr(r22)}</td><td className="hidden px-5 py-3 sm:table-cell">{inr(r24)}</td><td className="px-5 py-3 font-medium text-wine-800">{inr(r22 * 10)}</td></tr>
              ))}
            </tbody>
          </table>
          </div>
        </Reveal>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop?category=coin" className="rounded-full bg-wine-700 px-6 py-3 text-sm text-white">Buy gold coins</Link>
        <Link href="/#savings" className="rounded-full border border-wine-700 px-6 py-3 text-sm text-wine-700">Start a savings plan</Link>
      </div>
    </div>
  );
}
