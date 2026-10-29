import Link from "next/link";
import { Bars, DailyChart } from "@/components/admin/Charts";
import { Title } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
import { inr } from "@/lib/pricing";
import { parseRange, salesReport } from "@/lib/reports";

const PRESETS = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"], ["month", "This month"], ["year", "This year"]];

export default async function Reports({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  await adminPage("reports");
  const r = parseRange(await searchParams);
  const rep = await salesReport(r);
  const k = rep.kpi;
  const kpis = [["Revenue", inr(k.revenue)], ["Orders", k.orders], ["Average order", inr(k.aov)], ["Customers who bought", k.customers], ["New accounts", k.newCustomers], ["Discounts given", inr(k.discount)], ["Cancelled orders", k.cancelled]];
  const card = "rounded-xl border border-stone-200 bg-white p-5";
  return (
    <div>
      <Title title="Sales Reports" sub={`${r.label} · cancelled orders are excluded from sales figures.`}>
        <a href={`/api/admin/orders?from=${r.from}&to=${r.to}`} className="rounded-lg bg-stone-900 px-3 py-2 text-sm text-white">Export orders (CSV)</a>
      </Title>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {PRESETS.map(([key, label]) => (
          <Link key={key} href={`/admin/reports?range=${key}`} className={`rounded-full px-3 py-1 text-xs ${r.key === key ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}>{label}</Link>
        ))}
        <form className="flex flex-wrap items-center gap-2 text-xs">
          <input type="date" name="from" defaultValue={r.from} aria-label="From date" className="rounded-lg border border-stone-300 px-2 py-1" />
          <span>to</span>
          <input type="date" name="to" defaultValue={r.to} aria-label="To date" className="rounded-lg border border-stone-300 px-2 py-1" />
          <button className="rounded-lg bg-amber-700 px-3 py-1 text-white">Apply</button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {kpis.map(([l, v]) => <div key={l as string} className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-[11px] uppercase tracking-wider text-stone-500">{l}</p><p className="mt-1 font-display text-2xl">{v}</p></div>)}
      </div>

      <section className={`mt-6 ${card}`}><h2 className="font-display text-2xl">Revenue by day</h2><div className="mt-3"><DailyChart data={rep.daily} /></div></section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={card}><h2 className="font-display text-2xl">By category</h2><div className="mt-3"><Bars rows={rep.byCategory.map((c) => ({ label: c.label, value: c.revenue, sub: `${c.qty} pcs` }))} /></div></section>
        <section className={card}><h2 className="font-display text-2xl">By city</h2><div className="mt-3"><Bars rows={rep.byCity.map((c) => ({ label: c.city, value: c.revenue, sub: `${c.orders} orders` }))} /></div></section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-display text-2xl">Top products</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-stone-500"><tr><th className="py-1">Product</th><th className="py-1 text-right">Pcs</th><th className="py-1 text-right">Revenue</th></tr></thead>
            <tbody>{rep.topProducts.map((p) => <tr key={p.id} className="border-t border-stone-100"><td className="py-1.5"><Link href={`/product/${p.id}`} target="_blank" className="hover:text-amber-700">{p.name}</Link></td><td className="py-1.5 text-right">{p.qty}</td><td className="py-1.5 text-right">{inr(p.revenue)}</td></tr>)}</tbody>
          </table>
          {!rep.topProducts.length && <p className="py-6 text-center text-sm text-stone-500">No sales in this period.</p>}
        </section>
        <section className={card}>
          <h2 className="font-display text-2xl">Top customers</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-stone-500"><tr><th className="py-1">Customer</th><th className="py-1 text-right">Orders</th><th className="py-1 text-right">Spent</th></tr></thead>
            <tbody>{rep.topCustomers.map((c, i) => <tr key={i} className="border-t border-stone-100"><td className="py-1.5">{c.customer_id ? <Link href={`/admin/customers/${c.customer_id}`} className="hover:text-amber-700">{c.name}</Link> : c.name}<span className="block text-xs text-stone-400">{c.phone}{!c.customer_id && " · guest"}</span></td><td className="py-1.5 text-right">{c.orders}</td><td className="py-1.5 text-right">{inr(c.spent)}</td></tr>)}</tbody>
          </table>
          {!rep.topCustomers.length && <p className="py-6 text-center text-sm text-stone-500">No sales in this period.</p>}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-display text-2xl">Orders by status</h2>
          <ul className="mt-3 space-y-1 text-sm">{rep.byStatus.map((s) => <li key={s.status} className="flex justify-between border-b border-stone-100 py-1.5 capitalize"><span>{s.status}</span><span>{s.n} · {inr(s.total)}</span></li>)}</ul>
          {!rep.byStatus.length && <p className="py-6 text-center text-sm text-stone-500">No orders in this period.</p>}
        </section>
        <section className={card}>
          <h2 className="font-display text-2xl">Coupon use</h2>
          <ul className="mt-3 space-y-1 text-sm">{rep.coupons.map((c) => <li key={c.code} className="flex justify-between border-b border-stone-100 py-1.5"><code>{c.code}</code><span>{c.uses} uses · −{inr(c.discount)}</span></li>)}</ul>
          {!rep.coupons.length && <p className="py-6 text-center text-sm text-stone-500">No coupons used.</p>}
        </section>
      </div>
    </div>
  );
}
