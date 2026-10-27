import { revalidatePath } from "next/cache";
import { guard, json } from "@/lib/api";
import { getDB, mutate } from "@/lib/db";
import type { Rate, Settings } from "@/lib/types";

export async function GET() {
  const denied = await guard(); if (denied) return denied;
  const db = await getDB();
  return json({ settings: db.settings, rates: db.rates });
}

export async function PUT(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const body = (await req.json()) as { settings?: Partial<Settings>; rates?: Rate[] };
  const out = await mutate((db) => {
    if (body.settings) db.settings = { ...db.settings, ...body.settings };
    if (body.rates) db.rates = body.rates.map((r) => ({ ...r, perGram: Number(r.perGram) || 0, change: Number(r.change) || 0 }));
    return { settings: db.settings, rates: db.rates };
  });
  revalidatePath("/", "layout");
  return json(out);
}
