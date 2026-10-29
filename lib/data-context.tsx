"use client";

import { createContext, useContext, useMemo } from "react";
import { buildMenu, type MenuItem } from "./menu";
import { priceBreakup, priceOf } from "./pricing";
import type { Product, PublicData } from "./types";

type Ctx = PublicData & {
  price: (p: Product) => number;
  breakup: (p: Product) => ReturnType<typeof priceBreakup>;
  catLabel: (slug: string) => string;
  getProduct: (id: string) => Product | undefined;
  menu: MenuItem[];
};
const DataCtx = createContext<Ctx | null>(null);

export function DataProvider({ data, children }: { data: PublicData; children: React.ReactNode }) {
  const value = useMemo<Ctx>(() => {
    const first = (pred: (p: Product) => boolean) => data.products.find(pred)?.images[0];
    return {
      ...data,
      price: (p) => priceOf(p, data.rates),
      breakup: (p) => priceBreakup(p, data.rates),
      catLabel: (slug) => data.categories.find((c) => c.slug === slug)?.label ?? slug,
      getProduct: (id) => data.products.find((p) => p.id === id),
      menu: buildMenu(data.categories, {
        all: data.slides[0]?.image,
        gold: first((p) => p.stone === "none" && p.metal === "yellow"),
        diamond: first((p) => p.stone === "diamond"),
        earring: first((p) => p.category === "earring"),
        wedding: data.brides[0]?.image,
        gifting: first((p) => p.gender === "Women" && p.category === "pendant"),
      }),
    };
  }, [data]);
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const c = useContext(DataCtx);
  if (!c) throw new Error("useData must be used inside DataProvider");
  return c;
}
