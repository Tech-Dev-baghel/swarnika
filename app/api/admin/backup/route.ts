import { revalidatePath } from "next/cache";
import { bad, guard, json, withStore } from "@/lib/api";
import { getDB, mutate } from "@/lib/db";
import type { DB } from "@/lib/types";

async function _GET() {
  const denied = await guard(); if (denied) return denied;
  const db = await getDB();
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(db, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="store-backup-${day}.json"` },
  });
}

const KEYS: (keyof DB)[] = ["settings", "rates", "products", "categories", "slides", "collections", "brides", "stores", "testimonials", "coupons", "orders", "appointments", "subscribers"];

async function _POST(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const data = (await req.json().catch(() => null)) as DB | null;
  if (!data || typeof data !== "object" || !data.settings || !Array.isArray(data.products) || !Array.isArray(data.rates)) return bad("That file isn't a store backup");
  await mutate((db) => { for (const k of KEYS) if (data[k] !== undefined) (db as Record<string, unknown>)[k] = data[k]; });
  revalidatePath("/", "layout");
  return json({ ok: true });
}

export const GET = withStore(_GET);
export const POST = withStore(_POST);
