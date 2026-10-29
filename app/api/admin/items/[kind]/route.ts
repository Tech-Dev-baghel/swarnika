import { revalidatePath } from "next/cache";
import { bad, isResponse, json, requireAdmin, withStore } from "@/lib/api";
import type { Section } from "@/lib/auth";
import { audit, db, deleteItem, getItem, ITEM_KINDS, listItems, saveItem, type ItemKind } from "@/lib/db";
import type { Category, Product } from "@/lib/types";

const SECTION: Record<ItemKind, Section> = {
  products: "products", categories: "catalog", collections: "catalog", slides: "content", brides: "content", stores: "content", testimonials: "content", coupons: "marketing",
};
type Ctx = { params: Promise<{ kind: string }> };

async function resolve(ctx: Ctx) {
  const { kind } = await ctx.params;
  if (!(ITEM_KINDS as readonly string[]).includes(kind)) return bad("Unknown section", 404);
  const k = kind as ItemKind;
  const me = await requireAdmin(SECTION[k]);
  return isResponse(me) ? me : { k, me };
}

function clean(k: ItemKind, body: Record<string, unknown>) {
  if (k === "categories" && typeof body.slug === "string") body.slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (k === "coupons" && typeof body.code === "string") body.code = body.code.trim().toUpperCase();
  if (k === "products") for (const f of ["weight", "makingPct", "stoneValue", "stock", "rating", "reviews"]) if (f in body) body[f] = Number(body[f]) || 0;
  return body;
}

async function _GET(_: Request, ctx: Ctx) {
  const r = await resolve(ctx); if (isResponse(r)) return r;
  return json(await listItems(r.k));
}

async function _POST(req: Request, ctx: Ctx) {
  const r = await resolve(ctx); if (isResponse(r)) return r;
  const body = clean(r.k, await req.json());
  if (r.k === "categories" && (await listItems<Category>("categories")).some((c) => c.slug === body.slug)) return bad("Another category already uses that link name (slug)", 409);
  const item = (await saveItem(r.k, body, true))!;
  await audit(r.me.email, `Added ${r.k.replace(/s$/, "")}`, String(body.name ?? body.label ?? body.title ?? body.code ?? item.id));
  revalidatePath("/", "layout");
  return json(item, 201);
}

async function _PUT(req: Request, ctx: Ctx) {
  const r = await resolve(ctx); if (isResponse(r)) return r;
  const body = clean(r.k, await req.json());
  const id = String(body.id ?? "");
  if (r.k === "categories" && typeof body.slug === "string") {
    const prev = await getItem<Category>("categories", id);
    if (prev && prev.slug !== body.slug) {
      if ((await listItems<Category>("categories")).some((c) => c.slug === body.slug && c.id !== id)) return bad("Another category already uses that link name (slug)", 409);
      // move products to the new slug
      await (await db()).query(`update items set data = jsonb_set(data, '{category}', to_jsonb($2::text)) where kind = 'products' and data->>'category' = $1`, [prev.slug, body.slug]);
    }
  }
  const out = await saveItem(r.k, body, false);
  if (!out) return bad("Not found", 404);
  await audit(r.me.email, `Updated ${r.k.replace(/s$/, "")}`, String(out.name ?? out.label ?? out.title ?? out.code ?? id));
  revalidatePath("/", "layout");
  return json(out);
}

async function _DELETE(req: Request, ctx: Ctx) {
  const r = await resolve(ctx); if (isResponse(r)) return r;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (r.k === "categories") {
    const c = await getItem<Category>("categories", id);
    const n = c ? (await listItems<Product>("products")).filter((p) => p.category === c.slug).length : 0;
    if (n) return bad(`${n} product${n > 1 ? "s" : ""} still use this category. Move them to another category first.`, 409);
  }
  const prev = await getItem<Record<string, unknown>>(r.k, id);
  await deleteItem(r.k, id);
  await audit(r.me.email, `Deleted ${r.k.replace(/s$/, "")}`, String(prev?.name ?? prev?.label ?? prev?.title ?? prev?.code ?? id));
  revalidatePath("/", "layout");
  return json({ ok: true });
}

export const GET = withStore(_GET);
export const POST = withStore(_POST);
export const PUT = withStore(_PUT);
export const DELETE = withStore(_DELETE);
