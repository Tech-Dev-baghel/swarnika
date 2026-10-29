"use client";

import Link from "next/link";
import { useState } from "react";
import { useData } from "@/lib/data-context";
import { Reveal } from "./Motion";

export default function Footer() {
  const { settings, categories } = useData();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const cols = [
    { title: "Shop", links: [["All Jewellery", "/shop"], ...categories.slice(0, 5).map((c) => [c.label, `/shop?category=${c.slug}`])] },
    { title: "Customer Service", links: [["My Account", "/account"], ["Track Order", "/track"], ["Shipping", "/shipping"], ["Returns & Exchange", "/returns"], ["FAQ", "/faq"], ["Contact Us", "/contact"]] },
    { title: "About", links: [["About Us", "/about"], ["Collections", "/collections"], ["Today's Gold Rate", "/gold-rate"], ["Store Locator", "/stores"], ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"]] },
  ];
  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setState("done"); setMsg("You're on the list — welcome!"); setEmail(""); } else { setState("error"); setMsg(j.error ?? "Something went wrong"); }
  };
  return (
    <footer className="mt-20 bg-wine-900 text-ivory/80">
      <Reveal>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="font-display text-3xl text-ivory">{settings.brandName}</p>
            <p className="mt-3 max-w-sm text-sm">{settings.tagline}</p>
            <p className="mt-3 text-sm"><a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-white">{settings.phone}</a> · <a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a></p>
            {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-gold-200 hover:text-white">Follow us on Instagram ↗</a>}
            <form onSubmit={subscribe} className="mt-6 flex max-w-sm overflow-hidden rounded-full bg-white/10">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Your email for new launches" aria-label="Email"
                className="w-full bg-transparent px-5 py-3 text-sm text-ivory outline-none placeholder:text-ivory/50" />
              <button disabled={state === "busy"} className="bg-gold-500 px-5 text-sm font-medium text-wine-900 transition-colors hover:bg-gold-400">{state === "busy" ? "…" : "Join"}</button>
            </form>
            {msg && <p className={`mt-2 text-xs ${state === "error" ? "text-red-300" : "text-gold-200"}`}>{msg}</p>}
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold-200">{c.title}</p>
              <ul className="space-y-2 text-sm">
                {c.links.map(([l, h]) => <li key={l}><Link href={h} className="transition-colors hover:text-white">{l}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ivory/50 sm:flex-row">
          <span>© {new Date().getFullYear()} {settings.brandName} Jewels. Prices shown are indicative.</span>
          <span>100% BIS Hallmarked · Secure payments · Free insured shipping</span>
        </div>
      </div>
    </footer>
  );
}
