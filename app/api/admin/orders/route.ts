import { revalidatePath } from "next/cache";
import { bad, isResponse, json, requireAdmin, str, withStore } from "@/lib/api";
import { audit, listOrders, updateOrder } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const csvCell = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/** CSV export of orders in a date range: /api/admin/orders?from=YYYY-MM-DD&to=YYYY-MM-DD */
async function _GET(req: Request) {
  const me = await requireAdmin("orders"); if (isResponse(me)) return me;
  const u = new URL(req.url);
  const from = u.searchParams.get("from") || undefined, to = u.searchParams.get("to") || undefined;
  const orders = await listOrders({ from, to: to ? new Date(new Date(to).getTime() + 864e5).toISOString() : undefined, status: u.searchParams.get("status") || undefined, limit: 5000 });
  const head = ["Order", "Date", "Status", "Customer", "Phone", "Email", "City", "Pincode", "Items", "Subtotal", "Discount", "Coupon", "Total"];
  const rows = orders.map((o) => [o.id, new Date(o.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), o.status, o.customer.name, o.customer.phone, o.customer.email, o.customer.city, o.customer.pincode,
    o.items.map((i) => `${i.name} x${i.qty}`).join("; "), o.subtotal, o.discount, o.coupon ?? "", o.total]);
  const csv = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  return new Response("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="orders-${from ?? "all"}-to-${to ?? "today"}.csv"` } });
}

async function _PUT(req: Request) {
  const me = await requireAdmin("orders"); if (isResponse(me)) return me;
  const b = await req.json().catch(() => ({}));
  if (b.status && !STATUSES.includes(b.status)) return bad("Unknown status");
  const o = await updateOrder(str(b.id, 60), { status: b.status, notes: b.notes !== undefined ? str(b.notes, 2000) : undefined });
  if (!o) return bad("Order not found", 404);
  await audit(me.email, b.status ? `Order ${o.id} → ${b.status}` : `Order ${o.id} notes updated`);
  revalidatePath("/", "layout");
  return json(o);
}
export const GET = withStore(_GET);
export const PUT = withStore(_PUT);
