"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [["Overview", "/account"], ["Orders", "/account/orders"], ["Addresses", "/account/addresses"], ["Wishlist", "/wishlist"], ["Profile & password", "/account/profile"]];

export default function AccountNav() {
  const path = usePathname();
  return (
    <nav className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto border-b border-wine-100 px-4 pb-3" aria-label="Account sections">
      {TABS.map(([l, h]) => {
        const on = h === "/account" ? path === h : path.startsWith(h);
        return <Link key={h} href={h} className={`shrink-0 rounded-full px-4 py-2 text-sm ${on ? "bg-wine-700 text-white" : "bg-white text-ink/70 hover:text-wine-700"}`}>{l}</Link>;
      })}
    </nav>
  );
}
