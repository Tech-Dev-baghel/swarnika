import { revalidatePath } from "next/cache";
import { bad, guard, json } from "@/lib/api";
import { getDB, mutate, newId } from "@/lib/db";
import type { DB, Order } from "@/lib/types";

const RESOURCES = ["products", "categories", "slides", "collections", "brides", "stores", "testimonials", "coupons", "orders", "appointments", "subscribers"] as const;
type R = (typeof RESOURCES)[number];
const PREFIX: Record<R, string> = { products: "sw", categories: "cat", slides: "sl", collections: "co", brides: "br", stores: "st", testimonials: "t", coupons: "cp", orders: "ord", appointments: "ap", subscribers: "sub" };

type Item = { id: string } & Record<string, unknown>;
const list = (db: DB, r: R) => db[r] as unknown as Item[];

async function resolve(params: Promise<{ resource: string }>) {
  const { resource } = await params;
  return (RESOURCES as readonly string[]).includes(resource) ? (resource as R) : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ resource: string }> }) {
  const denied = await guard(); if (denied) return denied;
  const r = await resolve(params); if (!r) return bad("Unknown resource", 404);
  return json(list(await getDB(), r));
}

export async function POST(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const denied = await guard(); if (denied) return denied;
  const r = await resolve(params); if (!r) return bad("Unknown resource", 404);
  const body = (await req.json()) as Item;
  if (r === "categories") {
    const db = await getDB();
    if (db.categories.some((c) => c.slug === body.slug)) return bad("Another category already uses that slug", 409);
  }
  const item = await mutate((db) => {
    const arr = list(db, r);
    const id = body.id && !arr.some((x) => x.id === body.id) ? String(body.id) : newId(PREFIX[r]);
    const it = { ...body, id };
    arr.unshift(it);
    return it;
  });
  revalidatePath("/", "layout");
  return json(item, 201);
}

export async function PUT(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const denied = await guard(); if (denied) return denied;
  const r = await resolve(params); if (!r) return bad("Unknown resource", 404);
  const body = (await req.json()) as Item;
  const out = await mutate((db) => {
    const arr = list(db, r);
    const i = arr.findIndex((x) => x.id === body.id);
    if (i < 0) return null;
    const prev = arr[i];
    // Cancelling an order puts its pieces back in stock; un-cancelling takes them out again.
    if (r === "orders" && body.status && body.status !== prev.status && (body.status === "cancelled" || prev.status === "cancelled")) {
      const sign = body.status === "cancelled" ? 1 : -1;
      for (const it of (prev as unknown as Order).items) {
        const p = db.products.find((x) => x.id === it.id);
        if (p) p.stock = Math.max(0, (p.stock ?? 0) + sign * it.qty);
      }
    }
    // Renaming a category slug moves its products along with it.
    if (r === "categories" && typeof body.slug === "string" && body.slug !== prev.slug) {
      if (db.categories.some((c) => c.slug === body.slug && c.id !== prev.id)) return "dup" as const;
      for (const p of db.products) if (p.category === prev.slug) p.category = body.slug;
    }
    arr[i] = { ...prev, ...body };
    return arr[i];
  });
  if (out === "dup") return bad("Another category already uses that slug", 409);
  if (!out) return bad("Not found", 404);
  revalidatePath("/", "layout");
  return json(out);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const denied = await guard(); if (denied) return denied;
  const r = await resolve(params); if (!r) return bad("Unknown resource", 404);
  const id = new URL(req.url).searchParams.get("id");
  const blocked = await mutate((db) => {
    const arr = list(db, r);
    const i = arr.findIndex((x) => x.id === id);
    if (i < 0) return null;
    if (r === "categories") {
      const n = db.products.filter((p) => p.category === arr[i].slug).length;
      if (n) return `${n} product${n > 1 ? "s" : ""} still use this category. Move them to another category first.`;
    }
    arr.splice(i, 1);
    return null;
  });
  if (blocked) return bad(blocked, 409);
  revalidatePath("/", "layout");
  return json({ ok: true });
}
