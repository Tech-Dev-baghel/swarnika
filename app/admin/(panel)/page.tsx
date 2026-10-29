import Link from "next/link";
import { DailyChart } from "@/components/admin/Charts";
import { adminPage } from "@/lib/admin-guard";
import { can } from "@/lib/auth";
import { dbKind, getRates, listItems, listOrders } from "@/lib/db";
import { img, inr } from "@/lib/pricing";
import { parseRange, salesReport } from "@/lib/reports";
import type { Product } from "@/lib/types";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const me = await adminPage("dashboard");
  const { denied } = await searchParams;
  const [rep, orders, products, rates] = await Promise.all([salesReport(parseRange({ range: "30d" })), listOrders({ limit: 6 }), listItems<Product>("products"), getRates()]);
  const lowStock = products.filter((p) => p.active && Number(p.stock) <= 2).slice(0, 6);
  const r22 = rates.find((r) => r.purity === "22KT");
  const cards = [
    { label: "Revenue · last 30 days", value: inr(rep.kpi.revenue), href: "/admin/reports", section: "reports" },
    { label: "Orders · last 30 days", value: rep.kpi.orders, href: "/admin/orders", section: "orders" },
    { label: "Average order", value: inr(rep.kpi.aov), href: "/admin/reports", section: "reports" },
    { label: "New customers · 30 days", value: rep.kpi.newCustomers, href: "/admin/customers", section: "customers" },
    { label: "Products live", value: `${products.filter((p) => p.active).length} / ${products.length}`, href: "/admin/products", section: "products" },
    { label: "22KT rate", value: `${inr(r22?.perGram ?? 0)}/g`, href: "/admin/settings", section: "settings" },
  ] as const;
  return (
    <div>
      {dbKind() === "memory" && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Database not connected — changes can&apos;t be saved.</b> In Vercel open <b>Storage → Create Database → Neon</b>, connect it to this project and redeploy.
        </div>
      )}
      {denied && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Your role ({me.role}) can&apos;t open that section. Ask the owner if you need access.</div>}
      <h1 className="font-display text-4xl text-stone-900">Welcome, {me.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-stone-500">Here&apos;s how the store is doing. Everything you change goes live as soon as you save.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.filter((c) => can(me.role, c.section)).map((c) => (
          <Link key={c.label} href={c.href} className="rounded-xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase tracking-wider text-stone-500">{c.label}</p>
            <p className="mt-2 font-display text-3xl text-stone-900">{c.value}</p>
          </Link>
        ))}
      </div>

      {can(me.role, "reports") && (
        <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl">Sales · last 30 days</h2><Link href="/admin/reports" className="text-sm text-amber-700">Full reports →</Link></div>
          <div className="mt-3"><DailyChart data={rep.daily} /></div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl">Recent orders</h2><Link href="/admin/orders" className="text-sm text-amber-700">All orders →</Link></div>
          <ul className="mt-3 divide-y divide-stone-100">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <Link href={`/admin/orders/${o.id}`}><span className="font-mono">{o.id}</span> · {o.customer.name}</Link>
                <span className="flex items-center gap-3"><span className="capitalize text-stone-500">{o.status}</span><span className="font-medium">{inr(o.total)}</span></span>
              </li>
            ))}
            {!orders.length && <li className="py-6 text-center text-sm text-stone-500">No orders yet.</li>}
          </ul>
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl">Low stock</h2>{can(me.role, "reports") && <Link href="/admin/reports/inventory" className="text-sm text-amber-700">Inventory →</Link>}</div>
          <ul className="mt-3 space-y-2">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(p.images[0] ?? "", 100)} alt="" className="h-10 w-10 rounded bg-stone-100 object-cover" />
                <span className="flex-1">{p.name}</span><span className="font-medium text-red-700">{p.stock} left</span>
              </li>
            ))}
            {!lowStock.length && <li className="py-6 text-center text-sm text-stone-500">All products are well stocked.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
