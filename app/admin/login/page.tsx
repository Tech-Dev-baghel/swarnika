import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/AuthForms";
import { currentAdmin } from "@/lib/auth";
import { adminCount } from "@/lib/db";

export const metadata = { title: "Admin sign in", robots: { index: false } };

export default async function Page() {
  if ((await adminCount()) === 0) redirect("/admin/setup");
  if (await currentAdmin()) redirect("/admin");
  return <LoginForm />;
}
