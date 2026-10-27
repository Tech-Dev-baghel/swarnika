import Link from "next/link";
import { getDB } from "@/lib/db";
import { img, inr } from "@/lib/pricing";

export default async function Dashboard() {
  const db = await getDB();
  const live = db.orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((n, o) => n + o.total, 0);
  const lowStock = db.products.filter((p) => p.active && p.stock <= 2).slice(0, 6);
  const cards = [
    { label: "Revenue (all orders)", value: inr(revenue), href: "/admin/orders" },
    { label: "New orders", value: db.orders.filter((o) => o.status === "new").length, href: "/admin/orders" },
    { label: "Pending appointments", value: db.appointments.filter((a) => a.status === "pending").length, href: "/admin/appointments" },
    { label: "Products live", value: `${db.products.filter((p) => p.active).length} / ${db.products.length}`, href: "/admin/products" },
    { label: "Newsletter subscribers", value: db.subscribers.length, href: "/admin/subscribers" },
    { label: "22KT rate", value: `${inr(db.rates.find((r) => r.purity === "22KT")?.perGram ?? 0)}/g`, href: "/admin/settings" },
  ];
  return (
    <div>
      {!process.env.ADMIN_PASSWORD && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <b>You're using the default password (admin123).</b> Before going live, create a file named <code>.env.local</code> in the project folder with <code>ADMIN_PASSWORD=your-strong-password</code> and restart the site.
        </div>
      )}
      <h1 className="font-display text-4xl text-stone-900">Dashboard</h1>
      <p className="mt-1 text-sm text-stone-500">Everything on the website is managed from here. Changes go live as soon as you save.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs uppercase tracking-wider text-stone-500">{c.label}</p>
            <p className="mt-2 font-display text-3xl text-stone-900">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl">Recent orders</h2><Link href="/admin/orders" className="text-sm text-amber-700">All orders →</Link></div>
          <ul className="mt-3 divide-y divide-stone-100">
            {db.orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                <span><span className="font-mono">{o.id}</span> · {o.customer.name}</span>
                <span className="flex items-center gap-3"><span className="capitalize text-stone-500">{o.status}</span><span className="font-medium">{inr(o.total)}</span></span>
              </li>
            ))}
            {db.orders.length === 0 && <li className="py-6 text-center text-sm text-stone-500">No orders yet.</li>}
          </ul>
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-display text-2xl">Low stock</h2>
          <ul className="mt-3 space-y-2">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(p.images[0] ?? "", 100)} alt="" className="h-10 w-10 rounded bg-stone-100 object-cover" />
                <span className="flex-1">{p.name}</span><span className="font-medium text-red-700">{p.stock} left</span>
              </li>
            ))}
            {lowStock.length === 0 && <li className="py-6 text-center text-sm text-stone-500">All products are well stocked.</li>}
          </ul>
        </section>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["＋ Add a product", "/admin/products"], ["Update gold rates", "/admin/settings"], ["Change homepage banners", "/admin/banners"], ["Download a backup", "/admin/backup"]].map(([l, h]) => (
          <Link key={h} href={h} className="rounded-xl bg-stone-900 px-5 py-4 text-sm font-medium text-amber-100 transition hover:bg-stone-800">{l}</Link>
        ))}
      </section>
    </div>
  );
}
