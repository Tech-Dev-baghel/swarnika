import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CustomerForgot } from "@/components/AccountForms";
import { currentCustomer } from "@/lib/auth";

export const metadata = { title: "Forgot password — Swarnika Jewels", robots: { index: false } };

export default async function Page() {
  if (await currentCustomer()) redirect("/account");
  return <Suspense><CustomerForgot /></Suspense>;
}
