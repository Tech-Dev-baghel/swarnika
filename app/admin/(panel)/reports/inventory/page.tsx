import Link from "next/link";
import { Title } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
import { img, inr } from "@/lib/pricing";
import { inventoryReport } from "@/lib/reports";

export default async function Inventory() {
  await adminPage("reports");
  const { rows, totals } = await inventoryReport();
  const t = [["Pieces in stock", totals.pieces], ["Gold weight in stock", `${totals.goldGrams} g`], ["Stock value at today's prices", inr(totals.value)], ["Out of stock (live)", totals.outOfStock], ["Low stock (≤2)", totals.low]];
  return (
    <div>
      <Title title="Inventory" sub="Stock levels and value at today's gold rate. Lowest stock first. Edit stock in Products." />
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {t.map(([l, v]) => <div key={l as string} className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-[11px] uppercase tracking-wider text-stone-500">{l}</p><p className="mt-1 font-display text-2xl">{v}</p></div>)}
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500"><tr><th className="px-4 py-3">Product</th><th className="hidden px-4 py-3 md:table-cell">Category</th><th className="px-4 py-3 text-right">Stock</th><th className="hidden px-4 py-3 text-right sm:table-cell">Price</th><th className="px-4 py-3 text-right">Stock value</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-2"><div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(r.image ?? "", 100)} alt="" className="h-9 w-9 rounded bg-stone-100 object-cover" />
                  <span><Link href="/admin/products" className="hover:text-amber-700">{r.name}</Link>{!r.active && <span className="ml-1 text-xs text-stone-400">(hidden)</span>}</span></div></td>
                <td className="hidden px-4 py-2 md:table-cell">{r.category}</td>
                <td className={`px-4 py-2 text-right font-medium ${r.stock === 0 ? "text-red-600" : r.stock <= 2 ? "text-amber-700" : ""}`}>{r.stock}</td>
                <td className="hidden px-4 py-2 text-right sm:table-cell">{inr(r.price)}</td>
                <td className="px-4 py-2 text-right">{inr(r.stock * r.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
