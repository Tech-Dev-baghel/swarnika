"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useData } from "./data-context";

export const MAX_QTY = 10;
type CartLine = { id: string; qty: number; size?: string };
type Ctx = {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (id: string, size?: string) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  toggleWish: (id: string) => void;
  cartCount: number;
  toast: string | null;
  showToast: (msg: string) => void;
  storeOpen: boolean;
  setStoreOpen: (v: boolean) => void;
  bump: number;
  clearCart: () => void;
  customer: SessionCustomer | null;
};
export type SessionCustomer = { id: string; name: string; wishlist: string[] };

const StoreCtx = createContext<Ctx | null>(null);
const KEY = "swarnika-store-v1";

export function StoreProvider({ children, customer = null }: { children: React.ReactNode; customer?: SessionCustomer | null }) {
  const { products } = useData();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const wishRef = useRef<string[]>([]);
  wishRef.current = wishlist;
  const timer = useRef<number | undefined>(undefined);

  // Load saved bag/wishlist, dropping products that were removed or hidden since.
  useEffect(() => {
    const ids = new Set(products.map((p) => p.id));
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        const c: CartLine[] = Array.isArray(s.cart) ? s.cart : [];
        const w: string[] = Array.isArray(s.wishlist) ? s.wishlist : [];
        setCart(c.filter((l) => ids.has(l.id)).map((l) => ({ ...l, qty: Math.min(MAX_QTY, Math.max(1, Number(l.qty) || 1)) })));
        setWishlist(w.filter((id) => ids.has(id)));
      }
    } catch {}
    // Signed-in customers: merge this browser's wishlist with the one saved on their account.
    if (customer) setWishlist((w) => Array.from(new Set([...customer.wishlist, ...w])).filter((id) => ids.has(id)));
    setLoaded(true);
  }, [products, customer]);

  const synced = useRef<string>("");
  useEffect(() => {
    if (!loaded || !customer) return;
    const key = JSON.stringify(wishlist);
    if (key === synced.current || key === JSON.stringify(customer.wishlist)) { synced.current = key; return; }
    const t = window.setTimeout(() => {
      synced.current = key;
      fetch("/api/account/wishlist", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: JSON.parse(key) }) }).catch(() => {});
    }, 400);
    return () => window.clearTimeout(t);
  }, [wishlist, loaded, customer]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify({ cart, wishlist })); } catch {}
  }, [cart, wishlist, loaded]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const addToCart = useCallback((id: string, size?: string) => {
    setCart((c) => {
      const hit = c.find((l) => l.id === id);
      if (hit) return c.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1), size: size ?? l.size } : l));
      return [...c, { id, qty: 1, size }];
    });
    setBump((b) => b + 1);
    showToast("Added to your bag");
  }, [showToast]);
  const clearCart = useCallback(() => setCart([]), []);

  const setQty = useCallback((id: string, qty: number) =>
    setCart((c) => c.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, Math.max(1, qty)) } : l))), []);
  const removeFromCart = useCallback((id: string) => setCart((c) => c.filter((l) => l.id !== id)), []);
  const toggleWish = useCallback((id: string) => {
    const has = wishRef.current.includes(id);
    setWishlist((w) => (has ? w.filter((x) => x !== id) : w.includes(id) ? w : [...w, id]));
    showToast(has ? "Removed from wishlist" : "Saved to wishlist");
  }, [showToast]);

  const value = useMemo(() => ({
    cart, wishlist, addToCart, setQty, removeFromCart, toggleWish,
    cartCount: cart.reduce((n, l) => n + l.qty, 0), toast, showToast, storeOpen, setStoreOpen, bump, clearCart, customer,
  }), [cart, wishlist, addToCart, setQty, removeFromCart, toggleWish, toast, showToast, storeOpen, bump, clearCart, customer]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
