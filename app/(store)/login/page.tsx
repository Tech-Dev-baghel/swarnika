import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CustomerLogin } from "@/components/AccountForms";
import { currentCustomer } from "@/lib/auth";

export const metadata = { title: "Log in — Swarnika Jewels", robots: { index: false } };

export default async function Page() {
  if (await currentCustomer()) redirect("/account");
  return <Suspense><CustomerLogin /></Suspense>;
}
