import { bad, isResponse, json, requireCustomer, str, withStore } from "@/lib/api";
import { addReview, db, getItem } from "@/lib/db";

async function _POST(req: Request) {
  const me = await requireCustomer(); if (isResponse(me)) return me;
  const b = await req.json().catch(() => ({}));
  const productId = str(b.productId, 40), rating = Math.round(Number(b.rating));
  if (!(await getItem("products", productId))) return bad("Product not found", 404);
  if (!(rating >= 1 && rating <= 5)) return bad("Please choose 1 to 5 stars");
  const body = str(b.body, 1500);
  if (body.length < 10) return bad("Please write at least a sentence about the piece.");
  const dup = await (await db()).query(`select 1 from reviews where product_id = $1 and customer_id = $2`, [productId, me.id]);
  if (dup.length) return bad("You've already reviewed this product. Thank you!", 409);
  await addReview({ productId, customerId: me.id, name: me.name, rating, title: str(b.title, 100), body });
  return json({ ok: true }, 201);
}
export const POST = withStore(_POST);
