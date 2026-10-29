import Link from "next/link";
import Photo from "@/components/Photo";
import { GoldRateCard, HeroCarousel, ProductTabs, SavingsCalculator } from "@/components/HomeWidgets";
import { CalendarIcon, ChevronIcon, DiamondIcon, PinIcon, ShieldIcon, StarIcon, SwapIcon, TruckIcon, VideoIcon } from "@/components/Icons";
import { Marquee, Parallax, Reveal, Stagger, StaggerItem } from "@/components/Motion";
import { getPublicData } from "@/lib/db";

function Heading({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center">
      {eyebrow && <p className="text-xs uppercase tracking-[0.35em] text-gold-600">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-4xl text-wine-800 md:text-5xl">{title}</h2>
      {sub && <p className="mt-3 text-ink/60">{sub}</p>}
      <div className="mx-auto mt-4 flex items-center justify-center gap-2 text-gold-400"><span className="h-px w-10 bg-gold-200" />◆<span className="h-px w-10 bg-gold-200" /></div>
    </Reveal>
  );
}

const PRICE_TILES = [
  { label: "Under ₹25K", href: "/shop?max=25000" },
  { label: "₹25K – ₹50K", href: "/shop?min=25000&max=50000" },
  { label: "₹50K – ₹1L", href: "/shop?min=50000&max=100000" },
  { label: "Premium ₹1L+", href: "/shop?min=100000" },
];
const TRUST = [
  { icon: ShieldIcon, title: "100% BIS Hallmarked", text: "Every gold piece carries a HUID hallmark." },
  { icon: DiamondIcon, title: "Certified Diamonds", text: "Graded for cut, colour, clarity and carat." },
  { icon: SwapIcon, title: "Lifetime Exchange", text: "Full value on gold, at today's rate." },
  { icon: TruckIcon, title: "Free Insured Shipping", text: "15-day easy returns, no questions asked." },
];

export default async function Home() {
  const { categories, collections, brides, testimonials, products, settings } = await getPublicData();
  const pick = (f: (p: (typeof products)[number]) => boolean) => products.find(f)?.images[0];
  const priceImgs = [pick((p) => p.category === "earring"), pick((p) => p.category === "ring" && p.stone === "diamond"), pick((p) => p.category === "bangle"), pick((p) => p.category === "necklace" && p.stone === "diamond")];
  const gifts = [
    { t: "For Her", s: "Studs, pendants & more", h: "/shop?gender=Women&max=50000", img: pick((p) => p.gender === "Women" && p.category === "earring" && p.stone === "pearl") ?? pick((p) => p.gender === "Women") },
    { t: "For Him", s: "Kadas, chains & bands", h: "/shop?gender=Men", img: pick((p) => p.gender === "Men") },
    { t: "For Kids", s: "Tiny, safe & sweet", h: "/shop?gender=Kids", img: pick((p) => p.gender === "Kids") },
  ];

  return (
    <>
      <HeroCarousel />

      <section className="border-b border-wine-100 bg-white">
        <Stagger className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {TRUST.map(({ icon: I, title }) => (
            <StaggerItem key={title} className="flex items-center gap-3 text-sm text-wine-800"><I className="h-6 w-6 text-gold-500" />{title}</StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <Heading eyebrow="Find your piece" title="Shop by Category" sub="Browse through your favourite categories." />
        <Stagger className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0" gap={0.06}>
          {categories.map((c) => (
            <StaggerItem key={c.id} className="w-36 shrink-0 snap-start md:w-auto">
              <Link href={`/shop?category=${c.slug}`} className="group block text-center">
                <div className="relative aspect-square overflow-hidden rounded-full border-2 border-gold-200 p-1 transition-colors duration-300 group-hover:border-gold-500">
                  <Photo src={c.image} alt={c.label} w={400} className="h-full w-full rounded-full" imgClassName="transition-transform duration-700 group-hover:scale-110" fallback={{ kind: c.slug, metal: "yellow", stone: "none" }} />
                </div>
                <p className="mt-3 text-sm font-medium text-ink transition-colors group-hover:text-wine-700">{c.label}</p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[1fr_380px]">
        <div>
          <Reveal>
            <h2 className="font-display text-3xl text-wine-800">Shop by Budget</h2>
            <p className="mt-1 text-sm text-ink/60">Beautiful pieces for every price point.</p>
          </Reveal>
          <Stagger className="mt-6 grid grid-cols-2 gap-4">
            {PRICE_TILES.map((t, i) => (
              <StaggerItem key={t.label}>
                <Link href={t.href} className="group relative flex h-36 items-end overflow-hidden rounded-2xl p-5 text-ivory md:h-44">
                  <Photo src={priceImgs[i]} alt="" w={600} className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 via-wine-900/40 to-transparent" />
                  <span className="relative font-display text-2xl md:text-3xl">{t.label}</span>
                  <ChevronIcon className="relative ml-auto h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
        <Reveal delay={0.15}><GoldRateCard /></Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <Heading eyebrow="This season" title="Our Top Picks" sub="What everyone's adding to their bag right now." />
        <ProductTabs />
        <Reveal className="mt-10 text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-full border border-wine-700 px-7 py-3 text-sm text-wine-700 transition-colors hover:bg-wine-700 hover:text-white">View all jewellery <ChevronIcon className="h-4 w-4" /></Link>
        </Reveal>
      </section>

      {settings.marquee && <Marquee text={settings.marquee} />}

      <section id="collections" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Heading eyebrow="Signature" title={`${settings.brandName} Collections`} sub="Distinct stories, each crafted by hand." />
          <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {collections.map((c) => (
              <StaggerItem key={c.id}>
                <Link href={`/shop?collection=${encodeURIComponent(c.name)}`} className="group relative block aspect-[3/4] overflow-hidden rounded-3xl">
                  <Photo src={c.image} alt={c.name} w={700} className="absolute inset-0" imgClassName="transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 via-wine-900/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-ivory md:p-6">
                    <p className="font-display text-2xl md:text-3xl">{c.name}</p>
                    <p className="text-sm text-gold-200">{c.blurb}</p>
                    <span className="mt-3 inline-flex translate-y-2 items-center gap-1 text-xs uppercase tracking-widest transition-all duration-500 group-hover:translate-y-0 hover-reveal">Explore <ChevronIcon className="h-3 w-3" /></span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <Heading eyebrow="Wedding" title="Brides of Every Region" sub="Bridal sets that honour your traditions." />
        <Stagger className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-6 md:px-0" gap={0.07}>
          {brides.map((b) => (
            <StaggerItem key={b.id} className="w-40 shrink-0 md:w-auto">
              <Link href="/shop?occasion=Wedding" className="group relative flex h-64 flex-col justify-end overflow-hidden rounded-[999px_999px_24px_24px] p-5 text-center text-ivory">
                <Photo src={b.image} alt={`${b.name} bride`} w={500} className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 via-transparent to-transparent" />
                <span className="relative font-display text-xl">{b.name} Bride</span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section id="gifting" className="mx-auto max-w-7xl px-4 pb-16">
        <Heading eyebrow="Gifting" title="A Gift for Every Bond" />
        <Stagger className="grid gap-4 md:grid-cols-4">
          {gifts.map((g) => (
            <StaggerItem key={g.t}>
              <Link href={g.h} className="group flex h-full items-center gap-4 rounded-2xl border border-wine-100 bg-white p-4 transition-shadow hover:shadow-soft">
                <Photo src={g.img} alt="" w={200} className="h-20 w-20 shrink-0 rounded-xl" imgClassName="transition-transform duration-500 group-hover:scale-110" />
                <div><p className="font-display text-2xl text-wine-800">{g.t}</p><p className="text-sm text-ink/60">{g.s}</p></div>
              </Link>
            </StaggerItem>
          ))}
          <StaggerItem>
            <div className="shine h-full rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 p-5 text-wine-900">
              <p className="text-xs uppercase tracking-widest">E-Gift Card</p>
              <p className="mt-2 font-display text-3xl">₹1,000 – ₹1,00,000</p>
              <p className="mt-1 text-sm">Let them choose. Redeem online or in store.</p>
            </div>
          </StaggerItem>
        </Stagger>
      </section>

      <section id="savings" className="mx-auto max-w-7xl px-4"><Reveal><SavingsCalculator /></Reveal></section>

      <section className="mx-auto grid max-w-7xl items-stretch gap-6 px-4 py-16 lg:grid-cols-[1.1fr_1fr]">
        <Reveal className="h-full">
          <Parallax className="h-80 rounded-3xl lg:h-full">
            <Photo src={settings.storeImage} alt="Inside a store" w={1200} className="h-full w-full" />
          </Parallax>
        </Reveal>
        <div>
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-gold-600">Experience</p>
            <h2 className="mt-2 font-display text-4xl text-wine-800 md:text-5xl">Shop the Way You Like</h2>
          </Reveal>
          <Stagger className="mt-6 space-y-4">
            {[
              { I: PinIcon, t: "Visit a Store", s: "Try on, get sized and see the craft up close.", cta: "Find a store" },
              { I: VideoIcon, t: "Live Video Call", s: "An expert shows you designs live from the store.", cta: "Schedule a call" },
              { I: CalendarIcon, t: "Book an Appointment", s: "Reserve a private slot for bridal shopping.", cta: "Book now" },
            ].map(({ I, t, s, cta }) => (
              <StaggerItem key={t}>
                <Link href="/stores" className="group flex items-start gap-4 rounded-2xl border border-wine-100 bg-white p-5 transition-shadow hover:shadow-soft">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-600 transition-transform duration-300 group-hover:rotate-12"><I className="h-6 w-6" /></span>
                  <span>
                    <span className="block font-display text-2xl text-wine-800">{t}</span>
                    <span className="block text-sm text-ink/60">{s}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-wine-700">{cta} <ChevronIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="trust" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Heading eyebrow={`The ${settings.brandName} promise`} title="Trust in Every Gram" />
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ icon: I, title, text }) => (
              <StaggerItem key={title} className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-100"><I className="h-7 w-7 text-gold-600" /></div>
                <p className="mt-4 font-medium text-wine-800">{title}</p>
                <p className="mt-1 text-sm text-ink/60">{text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="guide" className="mx-auto grid max-w-7xl gap-4 px-4 py-16 md:grid-cols-2">
        <Reveal className="rounded-3xl border border-gold-200 bg-gold-100/50 p-8">
          <p className="font-display text-3xl text-wine-800">Ring Size Guide</p>
          <p className="mt-2 text-sm text-ink/70">Wrap a thread around your finger, mark it and measure the length in mm.</p>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-ink/50"><tr><th className="py-1">Circumference</th><th>Indian size</th></tr></thead>
            <tbody>{[[46.8, 6], [49.3, 9], [51.9, 12], [54.4, 15], [57.0, 18]].map(([c, s]) => <tr key={s} className="border-t border-gold-200"><td className="py-1.5">{c} mm</td><td>{s}</td></tr>)}</tbody>
          </table>
        </Reveal>
        <Reveal delay={0.1} className="rounded-3xl border border-wine-100 bg-white p-8">
          <p className="font-display text-3xl text-wine-800">Jewellery Care</p>
          <ul className="mt-4 space-y-3 text-sm text-ink/70">
            <li>◆ Store each piece separately in a soft pouch to avoid scratches.</li>
            <li>◆ Put jewellery on last — after perfume, lotion and hairspray.</li>
            <li>◆ Clean gold with mild soap and lukewarm water; pat dry.</li>
            <li>◆ Get free cleaning and prong checks at any {settings.brandName} store.</li>
          </ul>
        </Reveal>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4">
          <Heading eyebrow="Loved by customers" title="Stories from Our Family" />
          <Stagger className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <StaggerItem key={t.id}>
                <figure className="h-full rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex gap-0.5 text-gold-500">{[...Array(Math.max(1, Math.min(5, t.rating || 5)))].map((_, i) => <StarIcon key={i} />)}</div>
                  <blockquote className="mt-3 font-display text-xl leading-snug text-ink">&ldquo;{t.text}&rdquo;</blockquote>
                  <figcaption className="mt-4 text-sm text-ink/60">{t.name}, {t.city} · <span className="text-gold-600">{t.item}</span></figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </>
  );
}
