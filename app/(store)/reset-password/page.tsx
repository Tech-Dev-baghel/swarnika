import { Suspense } from "react";
import { CustomerReset } from "@/components/AccountForms";

export const metadata = { title: "Reset password — Swarnika Jewels", robots: { index: false } };

export default function Page() {
  return <Suspense><CustomerReset /></Suspense>;
}
