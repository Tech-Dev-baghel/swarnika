"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { useEscape } from "@/lib/hooks";

type Item = [label: string, href: string, section: string];
const NAV: { group: string; items: Item[] }[] = [
  { group: "Overview", items: [["Dashboard", "/admin", "dashboard"], ["Reports", "/admin/reports", "reports"], ["Inventory", "/admin/reports/inventory", "reports"]] },
  { group: "Sales", items: [["Orders", "/admin/orders", "orders"], ["Appointments", "/admin/appointments", "appointments"], ["Messages", "/admin/messages", "messages"], ["Customers", "/admin/customers", "customers"]] },
  { group: "Catalogue", items: [["Products", "/admin/products", "products"], ["Product Reviews", "/admin/reviews", "reviews"], ["Categories", "/admin/categories", "catalog"], ["Collections", "/admin/collections", "catalog"]] },
  { group: "Marketing", items: [["Coupons", "/admin/coupons", "marketing"], ["Newsletter", "/admin/subscribers", "marketing"]] },
  { group: "Website", items: [["Gold Rates & Settings", "/admin/settings", "settings"], ["Homepage Banners", "/admin/banners", "content"], ["Pages", "/admin/pages", "content"], ["Testimonials", "/admin/testimonials", "content"], ["Regional Brides", "/admin/brides", "content"], ["Stores", "/admin/stores", "content"]] },
  { group: "Account", items: [["Staff & Roles", "/admin/staff", "staff"], ["Activity Log", "/admin/activity", "activity"], ["Backup & Restore", "/admin/backup", "backup"], ["My Profile", "/admin/profile", "dashboard"]] },
];

export default function Sidebar({ brand, badges, allowed, user }: { brand: string; badges: Record<string, number>; allowed: string[]; user: { name: string; role: string } }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEscape(open, useCallback(() => setOpen(false), []));
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); router.refresh(); };
  const active = (href: string) => (href === "/admin" ? path === "/admin" : href === "/admin/reports" ? path === "/admin/reports" : path.startsWith(href));
  const nav = (
    <nav className="flex h-full flex-col">
      <div className="px-5 py-5">
        <p className="font-display text-2xl text-amber-200">{brand}</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">Admin</p>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV.map((g) => {
          const items = g.items.filter(([, , s]) => allowed.includes(s));
          if (!items.length) return null;
          return (
            <div key={g.group}>
              <p className="px-2 text-[10px] uppercase tracking-widest text-stone-500">{g.group}</p>
              <ul className="mt-1 space-y-0.5">
                {items.map(([label, href]) => (
                  <li key={href} className="relative">
                    {active(href) && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-lg bg-white/10" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                    <Link href={href} onClick={() => setOpen(false)} className={`relative flex items-center justify-between rounded-lg px-2 py-2 text-sm ${active(href) ? "text-white" : "text-stone-300 hover:text-white"}`}>
                      {label}
                      {badges[href] ? <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-stone-900">{badges[href]}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="space-y-1 border-t border-white/10 p-3">
        <p className="px-2 text-xs text-stone-400">{user.name} · <span className="capitalize">{user.role}</span></p>
        <a href="/" target="_blank" className="block rounded-lg px-2 py-2 text-sm text-stone-300 hover:text-white">View website ↗</a>
        <button onClick={logout} className="block w-full rounded-lg px-2 py-2 text-left text-sm text-stone-300 hover:text-white">Sign out</button>
      </div>
    </nav>
  );
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 bg-stone-900 lg:block print:!hidden">{nav}</aside>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-stone-900 px-4 py-3 lg:hidden print:hidden">
        <p className="font-display text-xl text-amber-200">{brand} Admin</p>
        <button onClick={() => setOpen(true)} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white" aria-label="Open admin menu">Menu</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="absolute inset-y-0 left-0 w-72 bg-stone-900">{nav}</motion.aside>
        </div>
      )}
    </>
  );
}
