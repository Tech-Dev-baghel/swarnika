import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { currentAdmin, SECTIONS, can, type Section } from "@/lib/auth";
import { adminCount, db, getSettings } from "@/lib/db";

export const metadata = { title: "Admin — Swarnika", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await currentAdmin();
  if (!me) redirect((await adminCount()) === 0 ? "/admin/setup" : "/admin/login");
  const q = (await db()).query;
  const [[c]] = await Promise.all([
    q<{ orders: number; appts: number; msgs: number; reviews: number }>(`select
      (select count(*) from orders where status = 'new')::int as orders,
      (select count(*) from appointments where status = 'pending')::int as appts,
      (select count(*) from messages where status = 'new')::int as msgs,
      (select count(*) from reviews where status = 'pending')::int as reviews`),
  ]);
  const badges = { "/admin/orders": c.orders, "/admin/appointments": c.appts, "/admin/messages": c.msgs, "/admin/reviews": c.reviews };
  const allowed = (Object.keys(SECTIONS) as Section[]).filter((s) => can(me.role, s));
  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 print:bg-white">
      <Sidebar brand={(await getSettings()).brandName} badges={badges} allowed={allowed} user={{ name: me.name, role: me.role }} />
      <div className="lg:pl-60 print:!pl-0">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
