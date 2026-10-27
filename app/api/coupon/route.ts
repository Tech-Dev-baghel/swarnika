import { bad, json } from "@/lib/api";
import { applyCoupon } from "@/lib/coupons";
import { getDB } from "@/lib/db";

export async function POST(req: Request) {
  const { code, subtotal } = await req.json().catch(() => ({}));
  const db = await getDB();
  const { discount, coupon } = applyCoupon(db.coupons, String(code ?? ""), Number(subtotal) || 0);
  if (!coupon) return bad("That code isn't valid or has expired.");
  return json({ code: coupon.code, discount, label: coupon.type === "percent" ? `${coupon.value}% off` : `₹${coupon.value} off` });
}
