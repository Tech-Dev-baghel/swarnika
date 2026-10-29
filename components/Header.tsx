"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useData } from "@/lib/data-context";
import { inr } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import Photo from "./Photo";
import { BagIcon, ChevronIcon, CloseIcon, HeartIcon, MenuIcon, PinIcon, SearchIcon, TruckIcon, UserIcon } from "./Icons";
import { useEscape } from "@/lib/hooks";

const SUGGESTIONS = ["gold necklace", "diamond earrings", "rings", "mangalsutra", "gold coin"];

function PromoBar() {
  const { settings } = useData();
  const [open, setOpen] = useState(true);
  useEffect(() => { try { if (sessionStorage.getItem("promo-closed") === settings.promoText) setOpen(false); } catch {} }, [settings.promoText]);
  const close = () => { setOpen(false); try { sessionStorage.setItem("promo-closed", settings.promoText); } catch {} };
  if (!settings.promoEnabled || !settings.promoText) return null;
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div exit={{ height: 0, opacity: 0 }} className="relative overflow-hidden bg-wine-900 text-[13px] text-gold-100">
          <div className="mx-auto max-w-7xl px-10 py-2 text-center">
            {settings.promoText}{" "}
            {settings.promoLink && <Link href={settings.promoLink} className="text-gold-200 underline underline-offset-2 hover:text-white">{settings.promoLinkText || "Shop now"}</Link>}
          </div>
          <button aria-label="Dismiss announcement" onClick={close} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-80 hover:opacity-100">
            <CloseIcon className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchBox({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const { products, catLabel } = useData();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const matches = q.trim()
    ? products.filter((p) => (p.name + " " + catLabel(p.category) + " " + p.collection).toLowerCase().includes(q.toLowerCase())).slice(0, 5)
    : [];
  const go = (term: string) => {
    router.push(`/shop?q=${encodeURIComponent(term)}`);
    setFocus(false);
    onDone?.();
  };
  return (
    <div className="relative w-full">
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q.trim()); }} className="flex items-center rounded-full border border-wine-100 bg-white pl-4 pr-2 transition-colors focus-within:border-gold-400">
        <SearchIcon className="h-4 w-4 text-wine-600" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          placeholder="Search for gold necklaces, rings…"
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-ink/40"
          aria-label="Search jewellery"
        />
      </form>
      <AnimatePresence>
        {focus && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-wine-100 bg-white p-3 shadow-soft"
          >
            {matches.length > 0 ? (
              <ul>
                {matches.map((p) => (
                  <li key={p.id}>
                    <Link href={`/product/${p.id}`} onClick={onDone} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-ivory">
                      <Photo src={p.images[0]} alt="" w={80} className="h-10 w-10 shrink-0 rounded-lg" fallback={{ kind: p.category, metal: p.metal, stone: p.stone }} />
                      <span className="flex-1">{p.name}</span><span className="text-ink/50">{catLabel(p.category)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p className="px-3 pb-2 text-xs uppercase tracking-widest text-ink/50">Popular searches</p>
                <div className="flex flex-wrap gap-2 px-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onMouseDown={() => go(s)} className="rounded-full border border-wine-100 px-3 py-1 text-sm hover:border-gold-400 hover:bg-gold-100">{s}</button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header() {
  const { cartCount, wishlist, setStoreOpen, bump, customer } = useStore();
  const { menu, rates, settings } = useData();
  const [active, setActive] = useState<number | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [openGroup, setOpenGroup] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const rate22 = rates.find((r) => r.purity === "22KT");
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; }, [drawer]);
  useEscape(drawer, useCallback(() => setDrawer(false), []));
  useEscape(active !== null, useCallback(() => setActive(null), []));

  const enter = (i: number) => { window.clearTimeout(timer.current); setActive(i); };
  const leave = () => { timer.current = window.setTimeout(() => setActive(null), 120); };
  const item = active !== null ? menu[active] : null;

  return (
    <>
      <PromoBar />
      <header className={`sticky top-0 z-40 border-b border-wine-100/70 backdrop-blur transition-[background-color,box-shadow] duration-300 ${scrolled ? "bg-ivory/90 shadow-[0_8px_30px_-20px_rgba(74,23,33,.5)]" : "bg-ivory"}`}>
        <div className={`mx-auto flex max-w-7xl items-center gap-4 px-4 transition-[padding] duration-300 md:gap-8 ${scrolled ? "py-2" : "py-3"}`}>
          <button className="lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><MenuIcon className="h-6 w-6 text-wine-800" /></button>
          <Link href="/" className="flex shrink-0 items-baseline gap-1" aria-label={`${settings.brandName} home`}>
            <span className="font-display text-3xl font-semibold tracking-wide text-wine-800">{settings.brandName}</span>
            <span className="hidden text-[11px] uppercase tracking-[0.3em] text-gold-600 sm:inline">Jewels</span>
          </Link>
          <div className="hidden flex-1 md:block"><SearchBox /></div>
          <nav className="ml-auto flex items-center gap-1 text-wine-800 sm:gap-3">
            {rate22 && (
              <Link href="/gold-rate" className="hidden items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1.5 text-xs font-medium text-gold-600 xl:flex">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" /></span>
                22KT {inr(rate22.perGram)}/g
              </Link>
            )}
            <button onClick={() => setStoreOpen(true)} className="hidden items-center gap-1.5 rounded-full px-2 py-2 text-sm hover:bg-wine-50 sm:flex"><PinIcon /><span className="hidden lg:inline">Stores</span></button>
            <Link href="/wishlist" className="relative rounded-full p-2 hover:bg-wine-50" aria-label="Wishlist">
              <HeartIcon />
              {wishlist.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-500 px-1 text-[10px] text-white">{wishlist.length}</span>}
            </Link>
            <Link href={customer ? "/account" : "/login"} className="flex items-center gap-1.5 rounded-full p-2 hover:bg-wine-50" aria-label={customer ? "My account" : "Log in"} title={customer ? "My account" : "Log in / Register"}>
              <UserIcon />{customer && <span className="hidden max-w-24 truncate text-sm lg:inline">{customer.name.split(" ")[0]}</span>}
            </Link>
            <Link href="/cart" className="relative rounded-full p-2 hover:bg-wine-50" aria-label="Shopping bag">
              <motion.span key={bump} initial={{ scale: 1 }} animate={{ scale: bump ? [1, 1.35, 1] : 1, rotate: bump ? [0, -12, 8, 0] : 0 }} transition={{ duration: 0.5 }} className="block"><BagIcon /></motion.span>
              {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-wine-700 px-1 text-[10px] text-white">{cartCount}</span>}
            </Link>
          </nav>
        </div>
        <div className="px-4 pb-3 md:hidden"><SearchBox /></div>

        <nav className="relative hidden border-t border-wine-100/70 lg:block" onMouseLeave={leave}>
          <ul className="mx-auto flex max-w-7xl justify-between px-4">
            {menu.map((m, i) => (
              <li key={m.label} onMouseEnter={() => (m.groups ? enter(i) : setActive(null))} className="relative">
                <Link href={m.href} className={`block px-2 py-3 text-[13px] font-medium uppercase tracking-wider transition-colors ${active === i ? "text-wine-700" : "text-ink/80 hover:text-wine-700"}`}>{m.label}</Link>
                {active === i && <motion.span layoutId="nav-underline" className="absolute inset-x-2 bottom-0 h-0.5 bg-gold-500" />}
              </li>
            ))}
          </ul>
          <AnimatePresence>
            {item?.groups && (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                onMouseEnter={() => enter(active!)}
                className="absolute inset-x-0 top-full border-t border-wine-100 bg-white shadow-soft"
              >
                <div className="mx-auto grid max-w-7xl grid-cols-5 gap-8 px-6 py-8">
                  {item.groups.map((g) => (
                    <div key={g.title}>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-600">{g.title}</p>
                      <ul className="space-y-2">
                        {g.links.map((l) => (
                          <li key={l.label}><Link href={l.href} onClick={() => setActive(null)} className="text-sm text-ink/75 transition-colors hover:text-wine-700">{l.label}</Link></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <Link href={item.href} onClick={() => setActive(null)} className="group relative col-start-5 flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl p-5 text-ivory">
                    <Photo src={item.image} alt="" w={500} className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 via-wine-900/30 to-transparent" />
                    <span className="relative font-display text-2xl">{item.label}</span>
                    <span className="relative mt-1 text-sm text-gold-200">{item.promo ?? "Explore the edit"}</span>
                    <span className="relative mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-widest">View all <ChevronIcon className="h-3 w-3" /></span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-ivory p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-2xl text-wine-800">Menu</span>
                <button onClick={() => setDrawer(false)} aria-label="Close menu"><CloseIcon /></button>
              </div>
              <ul className="divide-y divide-wine-100">
                {menu.map((m, i) => (
                  <li key={m.label} className="py-1">
                    {m.groups ? (
                      <>
                        <button onClick={() => setOpenGroup(openGroup === i ? null : i)} className="flex w-full items-center justify-between py-3 text-left font-medium text-wine-800">
                          {m.label}<ChevronIcon className={`h-4 w-4 transition ${openGroup === i ? "rotate-90" : ""}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {openGroup === i && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="space-y-4 pb-3 pl-2">
                                {m.groups.map((g) => (
                                  <div key={g.title}>
                                    <p className="text-[11px] uppercase tracking-widest text-gold-600">{g.title}</p>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                      {g.links.map((l) => <Link key={l.label} href={l.href} onClick={() => setDrawer(false)} className="text-sm text-ink/75">{l.label}</Link>)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link href={m.href} onClick={() => setDrawer(false)} className="block py-3 font-medium text-wine-800">{m.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
              <Link href={customer ? "/account" : "/login"} onClick={() => setDrawer(false)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-wine-700 py-3 text-sm text-white"><UserIcon /> {customer ? `My account (${customer.name.split(" ")[0]})` : "Log in / Register"}</Link>
              <Link href="/track" onClick={() => setDrawer(false)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-wine-700 py-3 text-sm text-wine-700"><TruckIcon /> Track an order</Link>
              <button onClick={() => { setDrawer(false); setStoreOpen(true); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-wine-700 py-3 text-sm text-wine-700"><PinIcon /> Find a store</button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
