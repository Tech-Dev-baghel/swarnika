import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "@/components/admin/PrintButton";
import { getDB } from "@/lib/db";
import { inr } from "@/lib/pricing";

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDB();
  const o = db.orders.find((x) => x.id === id);
  if (!o) notFound();
  const s = db.settings;
  const c = o.customer;
  // Jewellery GST is 3%; product prices already include it, so show the included amount.
  const gstIncluded = Math.round(o.total - o.total / 1.03);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin/orders" className="text-sm text-amber-700">← All orders</Link>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-10 shadow-sm print:shadow-none">
        <div className="flex items-start justify-between border-b border-stone-200 pb-6">
          <div>
            <p className="font-display text-3xl text-stone-900">{s.brandName} Jewels</p>
            <p className="mt-1 text-sm text-stone-500">{s.address}<br />{s.phone} · {s.email}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-display text-2xl">Invoice</p>
            <p className="font-mono">{o.id}</p>
            <p className="text-stone-500">{new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
          </div>
        </div>
        <div className="mt-6 text-sm">
          <p className="text-xs uppercase tracking-wider text-stone-500">Bill to</p>
          <p className="mt-1">{c.name}<br />{c.address}, {c.city} – {c.pincode}<br />{c.phone}{c.email && <> · {c.email}</>}</p>
        </div>
        <table className="mt-8 w-full text-left text-sm">
          <thead className="border-b border-stone-300 text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="py-2">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Amount</th></tr>
          </thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.id} className="border-b border-stone-100">
                <td className="py-2">{i.name}<span className="block text-xs text-stone-400">SKU {i.id.toUpperCase()}{i.size ? ` · Size ${i.size}` : ""}</span></td>
                <td className="py-2 text-center">{i.qty}</td>
                <td className="py-2 text-right">{inr(i.price)}</td>
                <td className="py-2 text-right">{inr(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto mt-6 w-64 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between"><dt className="text-stone-500">Discount {o.coupon}</dt><dd>−{inr(o.discount)}</dd></div>}
          <div className="flex justify-between border-t border-stone-300 pt-2 text-base font-semibold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
          <div className="flex justify-between text-xs text-stone-500"><dt>Includes GST (3%)</dt><dd>{inr(gstIncluded)}</dd></div>
        </dl>
        <p className="mt-10 border-t border-stone-200 pt-4 text-xs text-stone-500">All gold jewellery is BIS hallmarked. Lifetime exchange at prevailing gold rate. Thank you for shopping with {s.brandName}.</p>
      </div>
    </div>
  );
}
