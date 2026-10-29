import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/AccountForms";
import AccountNav from "@/components/AccountNav";
import { currentCustomer } from "@/lib/auth";

export const metadata = { title: "My Account — Swarnika Jewels", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const me = await currentCustomer();
  if (!me) redirect("/login?next=/account");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-600">My account</p>
          <h1 className="mt-1 font-display text-4xl text-wine-800 sm:text-5xl">Hello, {me.name.split(" ")[0]}</h1>
        </div>
        <LogoutButton className="rounded-full border border-wine-100 px-4 py-2 text-sm text-wine-700 hover:border-wine-700" />
      </div>
      <AccountNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
