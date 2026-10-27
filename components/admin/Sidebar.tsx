"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { useEscape } from "@/lib/hooks";

const NAV = [
  { group: "Overview", items: [["Dashboard", "/admin"]] },
  { group: "Sales", items: [["Orders", "/admin/orders"], ["Appointments", "/admin/appointments"], ["Coupons", "/admin/coupons"], ["Newsletter", "/admin/subscribers"]] },
  { group: "Catalogue", items: [["Products", "/admin/products"], ["Categories", "/admin/categories"], ["Collections", "/admin/collections"]] },
  { group: "Website", items: [["Gold Rates & Settings", "/admin/settings"], ["Backup & Restore", "/admin/backup"], ["Homepage Banners", "/admin/banners"], ["Regional Brides", "/admin/brides"], ["Stores", "/admin/stores"], ["Reviews", "/admin/reviews"]] },
];

export default function Sidebar({ brand, badges }: { brand: string; badges: Record<string, number> }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEscape(open, useCallback(() => setOpen(false), []));
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); router.refresh(); };
  const nav = (
    <nav className="flex h-full flex-col">
      <div className="px-5 py-5">
        <p className="font-display text-2xl text-amber-200">{brand}</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">Admin</p>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3">
        {NAV.map((g) => (
          <div key={g.group}>
            <p className="px-2 text-[10px] uppercase tracking-widest text-stone-500">{g.group}</p>
            <ul className="mt-1 space-y-0.5">
              {g.items.map(([label, href]) => {
                const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
                return (
                  <li key={href} className="relative">
                    {on && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-lg bg-white/10" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                    <Link href={href} onClick={() => setOpen(false)} className={`relative flex items-center justify-between rounded-lg px-2 py-2 text-sm ${on ? "text-white" : "text-stone-300 hover:text-white"}`}>
                      {label}
                      {badges[href] ? <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-stone-900">{badges[href]}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-white/10 p-3">
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
        <button onClick={() => setOpen(true)} className="text-sm text-white">Menu</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} className="absolute inset-y-0 left-0 w-64 bg-stone-900">{nav}</motion.aside>
        </div>
      )}
    </>
  );
}
