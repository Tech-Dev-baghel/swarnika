import type { Product, Rate } from "./types";

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function rateFor(rates: Rate[], purity: Product["purity"]) {
  return rates.find((r) => r.purity === purity)?.perGram ?? 0;
}

export function priceBreakup(p: Product, rates: Rate[]) {
  const metalValue = Math.round(p.weight * rateFor(rates, p.purity));
  const making = Math.round((metalValue * p.makingPct) / 100);
  const subtotal = metalValue + making + p.stoneValue;
  const gst = Math.round(subtotal * 0.03);
  return { metalValue, making, stoneValue: p.stoneValue, gst, total: subtotal + gst };
}

export const priceOf = (p: Product, rates: Rate[]) => priceBreakup(p, rates).total;

/** Unsplash image helper — width-limited, auto format. */
export const img = (src: string, w = 800) => {
  if (!src) return "";
  if (src.startsWith("https://images.unsplash.com/")) {
    const base = src.split("?")[0];
    return `${base}?auto=format&fit=crop&w=${w}&q=70`;
  }
  return src;
};
