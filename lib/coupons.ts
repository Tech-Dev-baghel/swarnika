import type { Coupon } from "./types";

export function applyCoupon(coupons: Coupon[], code: string | undefined, subtotal: number) {
  if (!code) return { discount: 0, coupon: undefined as Coupon | undefined };
  const c = coupons.find((x) => x.active && x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { discount: 0, coupon: undefined };
  const discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return { discount, coupon: c };
}
