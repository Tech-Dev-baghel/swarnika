import Link from "next/link";
import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import { StatusSteps } from "@/components/OrderStatus";
import { accountUser } from "@/lib/auth";
import { getOrder, getSettings } from "@/lib/db";
import { inr } from "@/lib/pricing";

export default async function MyOrder({ params }: { params: Promise<{ id: string }> }) {
  const me = await accountUser();
  const { id } = await params;
  const [o, s] = await Promise.all([getOrder(id), getSettings()]);
  if (!o || o.customerId !== me.id) notFound();
  const c = o.customer;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-3xl border border-wine-100 bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-sm">{o.id}</h2>
          <p className="text-sm text-ink/60">Placed {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</p>
        </div>
        <div className="mt-6"><StatusSteps s={o.status} /></div>
        <ul className="mt-6 divide-y divide-wine-100">
          {o.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
              <Photo src={i.image} alt="" w={140} className="h-16 w-16 shrink-0 rounded-xl" />
              <Link href={`/product/${i.id}`} className="flex-1 hover:text-wine-700">{i.name}<span className="block text-xs text-ink/50">Qty {i.qty}{i.size ? ` · Size ${i.size}` : ""}</span></Link>
              <span className="font-medium">{inr(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="ml-auto mt-4 max-w-64 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {o.coupon}</dt><dd>−{inr(o.discount)}</dd></div>}
          <div className="flex justify-between border-t border-wine-100 pt-2 font-semibold text-wine-800"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
        </dl>
      </section>
      <div className="space-y-6 text-sm">
        <section className="rounded-3xl border border-wine-100 bg-white p-6">
          <h2 className="font-display text-2xl text-wine-800">Delivery to</h2>
          <p className="mt-3">{c.name}<br />{c.phone}<br />{c.address}, {c.city} – {c.pincode}</p>
        </section>
        <section className="rounded-3xl border border-wine-100 bg-white p-6">
          <h2 className="font-display text-2xl text-wine-800">Need help?</h2>
          <p className="mt-2 text-ink/70">Call <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="text-wine-700">{s.phone}</a> or write to us from the <Link href={`/contact?subject=${encodeURIComponent("Order " + o.id)}`} className="text-wine-700">contact page</Link> with your order number.</p>
        </section>
        <Link href="/account/orders" className="inline-block text-wine-700">← All orders</Link>
      </div>
    </div>
  );
}
