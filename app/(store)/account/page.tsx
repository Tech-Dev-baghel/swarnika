import Link from "next/link";
import Photo from "@/components/Photo";
import { StatusPill } from "@/components/OrderStatus";
import { accountUser } from "@/lib/auth";
import { listOrders } from "@/lib/db";
import { inr } from "@/lib/pricing";

export default async function AccountHome() {
  const me = await accountUser();
  const orders = await listOrders({ customerId: me.id, limit: 3 });
  const def = me.addresses.find((a) => a.isDefault) ?? me.addresses[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-3xl border border-wine-100 bg-white p-6">
        <div className="flex items-center justify-between"><h2 className="font-display text-2xl text-wine-800">Recent orders</h2><Link href="/account/orders" className="text-sm text-wine-700">All orders →</Link></div>
        <ul className="mt-4 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="flex items-center gap-3 rounded-2xl p-2 -mx-2 hover:bg-ivory">
                <Photo src={o.items[0]?.image} alt="" w={120} className="h-14 w-14 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1"><span className="line-clamp-2 text-sm font-medium sm:line-clamp-1">{o.items.map((i) => i.name).join(", ")}</span><span className="block text-xs text-ink/50"><span className="break-all">{o.id}</span> · <span className="whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span></span>
                  <span className="mt-1 flex items-center gap-2 text-sm sm:hidden"><span className="font-semibold text-wine-800">{inr(o.total)}</span><StatusPill s={o.status} /></span></span>
                <span className="hidden shrink-0 text-right text-sm sm:block"><span className="block font-semibold text-wine-800">{inr(o.total)}</span><StatusPill s={o.status} /></span>
              </Link>
            </li>
          ))}
          {!orders.length && <li className="py-8 text-center text-sm text-ink/60">No orders yet. <Link href="/shop" className="text-wine-700">Start shopping →</Link></li>}
        </ul>
      </section>
      <div className="space-y-6">
        <section className="rounded-3xl border border-wine-100 bg-white p-6 text-sm">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl text-wine-800">Your details</h2><Link href="/account/profile" className="text-wine-700">Edit</Link></div>
          <p className="mt-3">{me.name}<br />{me.email ?? "—"}<br />{me.phone ?? "—"}</p>
        </section>
        <section className="rounded-3xl border border-wine-100 bg-white p-6 text-sm">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl text-wine-800">Default address</h2><Link href="/account/addresses" className="text-wine-700">Manage</Link></div>
          <p className="mt-3">{def ? <>{def.name}, {def.phone}<br />{def.address}, {def.city} – {def.pincode}</> : "No address saved yet."}</p>
        </section>
      </div>
    </div>
  );
}
