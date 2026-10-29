import Link from "next/link";
import Photo from "@/components/Photo";
import { StatusPill } from "@/components/OrderStatus";
import { accountUser } from "@/lib/auth";
import { listOrders } from "@/lib/db";
import { inr } from "@/lib/pricing";

export default async function MyOrders() {
  const me = await accountUser();
  const orders = await listOrders({ customerId: me.id });
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center gap-4 rounded-3xl border border-wine-100 bg-white p-4 hover:shadow-soft">
            <div className="flex -space-x-3">{o.items.slice(0, 3).map((i) => <Photo key={i.id} src={i.image} alt="" w={120} className="h-14 w-14 rounded-xl border-2 border-white" />)}</div>
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{o.items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ")}</p><p className="text-xs text-ink/50">{o.id} · {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p></div>
            <div className="text-right"><p className="font-semibold text-wine-800">{inr(o.total)}</p><StatusPill s={o.status} /></div>
          </Link>
        </li>
      ))}
      {!orders.length && <li className="rounded-3xl border border-dashed border-gold-200 p-12 text-center text-ink/60">You haven&apos;t ordered yet. <Link href="/shop" className="text-wine-700">Browse jewellery →</Link></li>}
    </ul>
  );
}
