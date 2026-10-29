import { bad, json, withStore } from "@/lib/api";
import { applyCoupon } from "@/lib/coupons";
import { listItems } from "@/lib/db";
import type { Coupon } from "@/lib/types";

async function _POST(req: Request) {
  const { code, subtotal } = await req.json().catch(() => ({}));
  const { discount, coupon } = applyCoupon(await listItems<Coupon>("coupons"), String(code ?? ""), Number(subtotal) || 0);
  if (!coupon) return bad("That code isn't valid or has expired.");
  return json({ code: coupon.code, discount, label: coupon.type === "percent" ? `${coupon.value}% off` : `₹${coupon.value} off` });
}
export const POST = withStore(_POST);
