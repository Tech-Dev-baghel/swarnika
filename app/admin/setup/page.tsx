import { redirect } from "next/navigation";
import { SetupForm } from "@/components/admin/AuthForms";
import { adminCount, isPersistent, READONLY_MSG } from "@/lib/db";

export const metadata = { title: "Admin setup", robots: { index: false } };

export default async function Page() {
  if ((await adminCount()) > 0) redirect("/admin/login");
  if (!isPersistent()) return <div className="grid min-h-screen place-items-center bg-stone-900 p-6"><p className="max-w-md rounded-2xl bg-white p-8 text-sm text-stone-700">{READONLY_MSG}</p></div>;
  return <SetupForm />;
}
