import "server-only";
import { db, getRates, listItems } from "./db";
import { priceOf } from "./pricing";
import type { Category, Product } from "./types";

export const TZ = process.env.STORE_TIMEZONE || "Asia/Kolkata";

export type Range = { from: string; to: string; label: string; key: string };

/** Turns ?range=30d / ?from=&to= into a date range (inclusive of `to` day). */
export function parseRange(sp: { range?: string; from?: string; to?: string }): Range {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const days = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n + 1); return ymd(d); };
  if (sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from)) {
    const to = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : ymd(today);
    return { from: sp.from, to, label: `${sp.from} → ${to}`, key: "custom" };
  }
  switch (sp.range) {
    case "today": return { from: ymd(today), to: ymd(today), label: "Today", key: "today" };
    case "7d": return { from: days(7), to: ymd(today), label: "Last 7 days", key: "7d" };
    case "90d": return { from: days(90), to: ymd(today), label: "Last 90 days", key: "90d" };
    case "month": return { from: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), to: ymd(today), label: "This month", key: "month" };
    case "year": return { from: ymd(new Date(today.getFullYear(), 0, 1)), to: ymd(today), label: "This year", key: "year" };
    default: return { from: days(30), to: ymd(today), label: "Last 30 days", key: "30d" };
  }
}

export async function salesReport(r: Range) {
  const q = (await db()).query;
  // Dates are compared in the store's timezone.
  const W = `(created_at at time zone '${TZ}')::date between $1::date and $2::date`;
  const P = [r.from, r.to];
  const [kpi] = await q<{ orders: number; revenue: number; cancelled: number; discount: number; customers: number }>(
    `select count(*) filter (where status <> 'cancelled')::int as orders,
            coalesce(sum(total) filter (where status <> 'cancelled'), 0)::int as revenue,
            count(*) filter (where status = 'cancelled')::int as cancelled,
            coalesce(sum(discount) filter (where status <> 'cancelled'), 0)::int as discount,
            count(distinct coalesce(customer_id, customer->>'phone')) filter (where status <> 'cancelled')::int as customers
     from orders where ${W}`, P);
  const [newCust] = await q<{ n: number }>(`select count(*)::int as n from customers where ${W}`, P);
  const daily = await q<{ day: string; orders: number; revenue: number }>(
    `select to_char(d, 'YYYY-MM-DD') as day, coalesce(o.orders, 0)::int as orders, coalesce(o.revenue, 0)::int as revenue
     from generate_series($1::date, $2::date, interval '1 day') d
     left join (select (created_at at time zone '${TZ}')::date as day, count(*) orders, sum(total) revenue from orders
                where status <> 'cancelled' and ${W} group by 1) o on o.day = d::date order by d`, P);
  const byStatus = await q<{ status: string; n: number; total: number }>(`select status, count(*)::int as n, coalesce(sum(total),0)::int as total from orders where ${W} group by status order by n desc`, P);
  const lines = await q<{ id: string; name: string; qty: number; revenue: number }>(
    `select li->>'id' as id, max(li->>'name') as name, sum((li->>'qty')::int)::int as qty, sum((li->>'qty')::int * (li->>'price')::int)::int as revenue
     from orders, jsonb_array_elements(items) li where status <> 'cancelled' and ${W} group by 1 order by revenue desc`, P);
  const byCity = await q<{ city: string; orders: number; revenue: number }>(
    `select initcap(trim(coalesce(nullif(customer->>'city',''), 'Unknown'))) as city, count(*)::int as orders, sum(total)::int as revenue
     from orders where status <> 'cancelled' and ${W} group by 1 order by revenue desc limit 10`, P);
  const coupons = await q<{ code: string; uses: number; discount: number }>(
    `select coupon as code, count(*)::int as uses, sum(discount)::int as discount from orders where coupon is not null and status <> 'cancelled' and ${W} group by 1 order by uses desc`, P);
  const topCustomers = await q<{ name: string; phone: string; orders: number; spent: number; customer_id: string | null }>(
    `select max(customer->>'name') as name, max(customer->>'phone') as phone, max(customer_id) as customer_id, count(*)::int as orders, sum(total)::int as spent
     from orders where status <> 'cancelled' and ${W} group by coalesce(customer_id, customer->>'phone') order by spent desc limit 10`, P);

  // Category split: join order lines to the product's current category.
  const [products, categories] = await Promise.all([listItems<Product>("products"), listItems<Category>("categories")]);
  const catOf = new Map(products.map((p) => [p.id, p.category]));
  const label = new Map(categories.map((c) => [c.slug, c.label]));
  const catMap = new Map<string, { label: string; qty: number; revenue: number }>();
  for (const l of lines) {
    const slug = catOf.get(l.id) ?? "other";
    const cur = catMap.get(slug) ?? { label: label.get(slug) ?? "Other", qty: 0, revenue: 0 };
    cur.qty += l.qty; cur.revenue += l.revenue;
    catMap.set(slug, cur);
  }
  const byCategory = [...catMap.values()].sort((a, b) => b.revenue - a.revenue);
  return { kpi: { ...kpi, newCustomers: newCust.n, aov: kpi.orders ? Math.round(kpi.revenue / kpi.orders) : 0 }, daily, byStatus, topProducts: lines.slice(0, 10), byCategory, byCity, coupons, topCustomers };
}

export async function inventoryReport() {
  const [products, rates, categories] = await Promise.all([listItems<Product>("products"), getRates(), listItems<Category>("categories")]);
  const label = new Map(categories.map((c) => [c.slug, c.label]));
  const rows = products.map((p) => ({ id: p.id, name: p.name, category: label.get(p.category) ?? p.category, active: p.active, stock: Number(p.stock) || 0, weight: Number(p.weight) || 0, price: priceOf(p, rates), image: p.images?.[0] }));
  return {
    rows: rows.sort((a, b) => a.stock - b.stock),
    totals: {
      pieces: rows.reduce((n, r) => n + r.stock, 0),
      goldGrams: Math.round(rows.reduce((n, r) => n + r.stock * r.weight, 0) * 10) / 10,
      value: rows.reduce((n, r) => n + r.stock * r.price, 0),
      outOfStock: rows.filter((r) => r.stock === 0 && r.active).length,
      low: rows.filter((r) => r.stock > 0 && r.stock <= 2 && r.active).length,
    },
  };
}
