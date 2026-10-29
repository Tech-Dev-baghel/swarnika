import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerActions, Title } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
import { customerRow, listOrders, toCustomer } from "@/lib/db";
import { inr } from "@/lib/pricing";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await adminPage("customers");
  const { id } = await params;
  const row = await customerRow("id", id);
  if (!row) notFound();
  const c = toCustomer(row);
  const orders = await listOrders({ customerId: id });
  const spent = orders.filter((o) => o.status !== "cancelled").reduce((n, o) => n + o.total, 0);
  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-amber-700">← All customers</Link>
      <div className="mt-3"><Title title={c.name} sub={`${c.email ?? "no email"} · ${c.phone ?? "no phone"} · joined ${c.createdAt.slice(0, 10)}`} /></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Orders", orders.length], ["Total spent", inr(spent)], ["Last sign-in", c.lastLogin ? new Date(c.lastLogin).toLocaleDateString("en-IN") : "—"]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-stone-200 bg-white p-5"><p className="text-xs uppercase tracking-wider text-stone-500">{l}</p><p className="mt-1 font-display text-3xl">{v}</p></div>
        ))}
      </div>
      <div className="mt-6"><CustomerActions c={c} /></div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-display text-2xl">Orders</h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/admin/orders/${o.id}`} className="font-mono text-amber-700">{o.id}</Link>
                <span className="text-stone-500">{o.createdAt.slice(0, 10)}</span><span className="capitalize">{o.status}</span><span className="font-medium">{inr(o.total)}</span>
              </li>
            ))}
            {!orders.length && <li className="py-6 text-center text-sm text-stone-500">No orders yet.</li>}
          </ul>
        </section>
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-display text-2xl">Saved addresses</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {c.addresses.map((a) => <li key={a.id}><b>{a.label}</b>{a.isDefault && " (default)"}<br />{a.name}, {a.phone}<br />{a.address}, {a.city} – {a.pincode}</li>)}
            {!c.addresses.length && <li className="text-stone-500">None saved.</li>}
          </ul>
          <p className="mt-4 text-xs text-stone-500">Wishlist: {c.wishlist.length} item{c.wishlist.length === 1 ? "" : "s"}</p>
        </section>
      </div>
    </div>
  );
}
