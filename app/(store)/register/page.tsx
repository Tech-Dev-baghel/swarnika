import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CustomerRegister } from "@/components/AccountForms";
import { currentCustomer } from "@/lib/auth";

export const metadata = { title: "Create account — Swarnika Jewels", robots: { index: false } };

export default async function Page() {
  if (await currentCustomer()) redirect("/account");
  return <Suspense><CustomerRegister /></Suspense>;
}
