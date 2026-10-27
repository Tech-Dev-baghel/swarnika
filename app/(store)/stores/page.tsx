import { StoreFinder } from "@/components/Overlays";
import Photo from "@/components/Photo";
import { Reveal } from "@/components/Motion";
import { getPublicData } from "@/lib/db";

export const metadata = { title: "Store Locator — Swarnika Jewels" };

export default async function StoresPage() {
  const { settings } = await getPublicData();
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1fr_1.2fr]">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.35em] text-gold-600">Visit us</p>
        <h1 className="mt-2 font-display text-5xl text-wine-800">Find a {settings.brandName} Store</h1>
        <p className="mt-4 text-ink/60">Try on designs, get your ring sized, exchange old gold or book a private bridal consultation. Every store offers free cleaning and hallmark verification.</p>
        <div className="relative mt-8 overflow-hidden rounded-3xl p-8 text-ivory">
          <Photo src={settings.storeImage} alt="" w={900} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-wine-900/95 via-wine-900/60 to-wine-900/20" />
          <div className="relative pt-24">
            <p className="font-display text-3xl">Old gold, new love</p>
            <p className="mt-2 text-sm text-ivory/80">Bring gold from any jeweller. We test it with an XRF machine in front of you and give 100% value at today&apos;s rate towards new jewellery.</p>
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.1}><StoreFinder /></Reveal>
    </div>
  );
}
