import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "./Motion";
import { getPage } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

const LINKS = [["About Us", "/about"], ["FAQ", "/faq"], ["Shipping", "/shipping"], ["Returns & Exchange", "/returns"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"]];

export async function infoMeta(slug: string) {
  const p = await getPage(slug);
  return { title: p ? `${p.title} — Swarnika Jewels` : "Not found", description: p?.body.replace(/[#*\[\]()]/g, "").slice(0, 155) };
}

export default async function InfoPage({ slug }: { slug: string }) {
  const p = await getPage(slug);
  if (!p) notFound();
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[220px_1fr]">
      <nav className="order-2 lg:order-1" aria-label="Help pages">
        <p className="text-xs uppercase tracking-[0.3em] text-gold-600">Help & info</p>
        <ul className="mt-3 flex flex-wrap gap-2 lg:block lg:space-y-1">
          {LINKS.map(([l, h]) => <li key={h}><Link href={h} className={`block rounded-full px-3 py-1.5 text-sm lg:rounded-lg ${h === `/${slug}` ? "bg-wine-700 text-white" : "bg-white text-ink/70 hover:text-wine-700 lg:bg-transparent"}`}>{l}</Link></li>)}
        </ul>
      </nav>
      <Reveal className="order-1 lg:order-2">
        <h1 className="font-display text-5xl text-wine-800">{p.title}</h1>
        <article className="prose-jewel mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
        <p className="mt-10 text-xs text-ink/40">Last updated {new Date(p.updatedAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
      </Reveal>
    </div>
  );
}
