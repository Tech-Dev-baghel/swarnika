import { bad, isResponse, json, newIdSafe, requireCustomer, str, withStore } from "@/lib/account-helpers";
import { assertWritable, db } from "@/lib/db";
import type { Address } from "@/lib/types";

async function _PUT(req: Request) {
  const me = await requireCustomer(); if (isResponse(me)) return me;
  assertWritable();
  const { addresses } = await req.json().catch(() => ({}));
  if (!Array.isArray(addresses) || addresses.length > 10) return bad("Up to 10 addresses can be saved.");
  const clean: Address[] = addresses.map((a: Record<string, unknown>) => ({
    id: str(a.id, 40) || newIdSafe(), label: str(a.label, 30) || "Home", name: str(a.name, 80), phone: str(a.phone, 20),
    address: str(a.address, 300), city: str(a.city, 60), pincode: str(a.pincode, 6), isDefault: Boolean(a.isDefault),
  }));
  for (const a of clean) if (!a.name || !a.address || !/^\d{6}$/.test(a.pincode)) return bad("Each address needs a name, address and 6-digit pincode.");
  if (clean.length && !clean.some((a) => a.isDefault)) clean[0].isDefault = true;
  await (await db()).query(`update customers set addresses = $2 where id = $1`, [me.id, JSON.stringify(clean)]);
  return json({ addresses: clean });
}
export const PUT = withStore(_PUT);
