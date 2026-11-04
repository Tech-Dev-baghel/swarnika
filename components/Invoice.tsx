import { gstSplit, rupeesInWords, stateCode } from "@/lib/india";
import { inr } from "@/lib/pricing";
import type { Order, Settings } from "@/lib/types";

const money = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (d: string) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });

/** GST tax invoice. Prices on the site include 3% GST; this shows the taxable value and CGST+SGST or IGST. */
export default function Invoice({ o, s, hsnOf }: { o: Order; s: Settings; hsnOf: (productId: string) => string }) {
  const c = o.customer;
  const seller = o.gst?.sellerState || s.gstState;
  const buyer = c.state || o.gst?.buyerState || "";
  const rate = o.gst?.rate ?? 3;
  const tax = gstSplit(o.total, rate, seller, buyer);
  // Spread the discount and fees over lines in proportion, so line taxable values add up to the total.
  const gross = o.items.reduce((n, i) => n + i.price * i.qty, 0) || 1;
  const factor = (o.total - (o.shippingFee ?? 0) - (o.codFee ?? 0)) / gross;
  const rows = o.items.map((i) => {
    const amt = i.price * i.qty * factor;
    return { ...i, hsn: hsnOf(i.id) || s.hsnDefault || "7113", taxable: amt / (1 + rate / 100) };
  });
  const fees = [o.shippingFee ? { label: "Shipping charges", amt: o.shippingFee } : null, o.codFee ? { label: "Cash on delivery charges", amt: o.codFee } : null].filter(Boolean) as { label: string; amt: number }[];
  const proforma = !o.invoiceNo;
  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 text-stone-900 shadow-sm sm:p-10 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
        <div className="min-w-0">
          <p className="font-display text-3xl">{s.legalName || `${s.brandName} Jewels`}</p>
          <p className="mt-1 text-sm text-stone-500">{s.address}<br />{s.phone} · {s.email}</p>
          {s.gstin ? <p className="mt-1 text-sm">GSTIN: <span className="font-mono">{s.gstin}</span></p> : <p className="mt-1 text-xs text-red-600 print:hidden">Add your GSTIN in Settings → GST to print it here.</p>}
          <p className="text-sm text-stone-500">State: {seller}{stateCode(seller) ? ` (${stateCode(seller)})` : ""}</p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="font-display text-2xl">{proforma ? "Order summary" : "Tax Invoice"}</p>
          {o.invoiceNo && <p>Invoice no. <span className="font-mono">{o.invoiceNo}</span></p>}
          <p className="text-stone-500">Invoice date: {date(o.invoiceDate ?? o.createdAt)}</p>
          <p className="text-stone-500">Order <span className="font-mono">{o.id}</span></p>
          <p className="text-stone-500">Payment: {o.paymentMethod === "online" ? "Online" : "Cash on delivery"} · {o.paymentStatus === "paid" ? "Paid" : o.paymentStatus === "refunded" ? "Refunded" : "Due"}</p>
        </div>
      </div>
      {proforma && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">This is not a tax invoice yet. The invoice number is given when the order is confirmed{o.paymentMethod === "online" ? " and paid" : ""}.</p>}
      <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500">Bill to / Ship to</p>
          <p className="mt-1">{c.name}<br />{c.address}<br />{c.city}{buyer ? `, ${buyer}` : ""} – {c.pincode}<br />{c.phone}{c.email && <> · {c.email}</>}</p>
          {c.gstin && <p className="mt-1">GSTIN: <span className="font-mono">{c.gstin}</span></p>}
        </div>
        <div className="sm:text-right">
          <p className="text-xs uppercase tracking-wider text-stone-500">Place of supply</p>
          <p className="mt-1">{buyer || "—"}{stateCode(buyer) ? ` (${stateCode(buyer)})` : ""}</p>
          <p className="text-stone-500">{tax.intra ? "Intra-state: CGST + SGST" : "Inter-state: IGST"}</p>
        </div>
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-stone-300 text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="py-2">Item</th><th className="py-2">HSN</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Taxable value</th><th className="py-2 text-right">Amount (incl. GST)</th></tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-b border-stone-100 align-top">
                <td className="py-2">{i.name}<span className="block text-xs text-stone-400">SKU {i.id.toUpperCase()}{i.size ? ` · Size ${i.size}` : ""} · list price {inr(i.price)}</span></td>
                <td className="py-2 font-mono text-xs">{i.hsn}</td>
                <td className="py-2 text-center">{i.qty}</td>
                <td className="py-2 text-right">{money(i.taxable)}</td>
                <td className="py-2 text-right">{money(i.taxable * (1 + rate / 100))}</td>
              </tr>
            ))}
            {fees.map((f) => (
              <tr key={f.label} className="border-b border-stone-100"><td className="py-2">{f.label}</td><td className="py-2 font-mono text-xs">9968</td><td /><td className="py-2 text-right">{money(f.amt / (1 + rate / 100))}</td><td className="py-2 text-right">{money(f.amt)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="ml-auto mt-6 w-full max-w-72 space-y-1 text-sm">
        {o.discount > 0 && <div className="flex justify-between text-stone-500"><dt>Discount {o.coupon} (included above)</dt><dd>−{inr(o.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-stone-500">Taxable value</dt><dd>{money(tax.taxable)}</dd></div>
        {tax.intra ? (
          <>
            <div className="flex justify-between"><dt className="text-stone-500">CGST @ {rate / 2}%</dt><dd>{money(tax.cgst)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">SGST @ {rate / 2}%</dt><dd>{money(tax.sgst)}</dd></div>
          </>
        ) : <div className="flex justify-between"><dt className="text-stone-500">IGST @ {rate}%</dt><dd>{money(tax.igst)}</dd></div>}
        <div className="flex justify-between border-t border-stone-300 pt-2 text-base font-semibold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
      </dl>
      <p className="mt-2 text-right text-xs text-stone-500">{rupeesInWords(o.total)}</p>
      <p className="mt-10 border-t border-stone-200 pt-4 text-xs text-stone-500">All gold jewellery is BIS hallmarked. Lifetime exchange at prevailing gold rate. This is a computer-generated invoice. Thank you for shopping with {s.brandName}.</p>
    </div>
  );
}
