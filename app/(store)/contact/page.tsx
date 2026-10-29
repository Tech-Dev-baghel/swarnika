import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";
import { Reveal } from "@/components/Motion";
import { getSettings } from "@/lib/db";

export const metadata = { title: "Contact Us — Swarnika Jewels" };

export default async function Contact() {
  const s = await getSettings();
  const wa = s.whatsapp.replace(/\D/g, "");
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_1.2fr]">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.35em] text-gold-600">We&apos;re here to help</p>
        <h1 className="mt-2 font-display text-5xl text-wine-800">Contact Us</h1>
        <p className="mt-4 text-ink/70">Questions about a design, an order, sizing or gold exchange? Send us a message and our team will reply within one working day.</p>
        <dl className="mt-8 space-y-4 text-sm">
          <div><dt className="text-xs uppercase tracking-widest text-gold-600">Call</dt><dd><a href={`tel:${s.phone.replace(/\s/g, "")}`} className="text-lg text-wine-800">{s.phone}</a></dd></div>
          {wa && <div><dt className="text-xs uppercase tracking-widest text-gold-600">WhatsApp</dt><dd><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="text-lg text-wine-800">Chat with us →</a></dd></div>}
          <div><dt className="text-xs uppercase tracking-widest text-gold-600">Email</dt><dd><a href={`mailto:${s.email}`} className="text-lg text-wine-800">{s.email}</a></dd></div>
          <div><dt className="text-xs uppercase tracking-widest text-gold-600">Head office</dt><dd className="text-ink/80">{s.address}</dd></div>
          <div><dt className="text-xs uppercase tracking-widest text-gold-600">Stores</dt><dd><a href="/stores" className="text-wine-800">Find a store near you →</a></dd></div>
        </dl>
      </Reveal>
      <Reveal delay={0.1}><Suspense><ContactForm /></Suspense></Reveal>
    </div>
  );
}
