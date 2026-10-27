import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { isAdmin } from "@/lib/auth";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Swarnika", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const db = await getDB();
  const badges = {
    "/admin/orders": db.orders.filter((o) => o.status === "new").length,
    "/admin/appointments": db.appointments.filter((a) => a.status === "pending").length,
  };
  return (
    <div className="min-h-screen bg-stone-100 print:bg-white font-sans text-stone-800">
      <Sidebar brand={db.settings.brandName} badges={badges} />
      <div className="lg:pl-60 print:!pl-0">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
