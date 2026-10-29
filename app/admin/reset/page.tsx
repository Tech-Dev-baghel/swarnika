import { Suspense } from "react";
import { AdminResetForm } from "@/components/admin/AuthForms";
export const metadata = { title: "Reset password", robots: { index: false } };
export default function Page() { return <Suspense><AdminResetForm /></Suspense>; }
