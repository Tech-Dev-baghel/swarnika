import "server-only";
import { cache } from "react";
import { applyCoupon } from "./coupons";
import { PAGE_SEED } from "./pages-seed";
import { priceOf } from "./pricing";
import { SEED } from "./seed";
import { driver, dbKind, isPersistent, type Q } from "./sql";
import type {
  AdminUser, Appointment, AuditEntry, Customer, DB, Message, Order, OrderStatus, Page, Product, PublicData, Rate, Review, Role, Settings, Subscriber,
} from "./types";

export { dbKind, isPersistent };
export class StorageError extends Error {}
export const READONLY_MSG =
  "The website isn't connected to a database yet, so this can't be saved. In Vercel open Storage → Create Database → Neon (Postgres) → connect it to this project, then redeploy.";

export const ITEM_KINDS = ["products", "categories", "slides", "collections", "brides", "stores", "testimonials", "coupons"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ------------------------------------------------------------------ schema */

const SCHEMA = `
create table if not exists kv (key text primary key, value jsonb not null);
create table if not exists items (kind text not null, id text not null, data jsonb not null, sort integer not null default 0, created_at timestamptz not null default now(), primary key (kind, id));
create table if not exists customers (id text primary key, name text not null, email text unique, phone text unique, password_hash text not null,
  session_version integer not null default 1, addresses jsonb not null default '[]', wishlist jsonb not null default '[]', active boolean not null default true,
  created_at timestamptz not null default now(), last_login timestamptz);
create table if not exists admins (id text primary key, name text not null, email text unique not null, password_hash text not null, role text not null,
  active boolean not null default true, session_version integer not null default 1, created_at timestamptz not null default now(), last_login timestamptz);
create table if not exists orders (id text primary key, created_at timestamptz not null default now(), customer_id text, status text not null,
  subtotal integer not null, discount integer not null default 0, total integer not null, coupon text, customer jsonb not null, items jsonb not null, notes text not null default '');
create index if not exists orders_created on orders (created_at);
create index if not exists orders_customer on orders (customer_id);
create table if not exists appointments (id text primary key, created_at timestamptz not null default now(), store text not null, type text not null,
  name text not null, phone text not null, date text not null default '', status text not null default 'pending', customer_id text);
create table if not exists subscribers (id text primary key, email text unique not null, created_at timestamptz not null default now());
create table if not exists messages (id text primary key, created_at timestamptz not null default now(), name text not null, email text not null default '',
  phone text not null default '', subject text not null default '', body text not null, status text not null default 'new');
create table if not exists reviews (id text primary key, created_at timestamptz not null default now(), product_id text not null, customer_id text,
  name text not null, rating integer not null, title text not null default '', body text not null, status text not null default 'pending');
create index if not exists reviews_product on reviews (product_id);
create table if not exists pages (slug text primary key, title text not null, body text not null, updated_at timestamptz not null default now());
create table if not exists media (id text primary key, content_type text not null, data bytea not null, size integer not null, created_at timestamptz not null default now());
create table if not exists password_resets (token_hash text primary key, user_type text not null, user_id text not null, expires_at timestamptz not null, used boolean not null default false);
create table if not exists audit_log (id text primary key, created_at timestamptz not null default now(), actor text not null, action text not null, detail text not null default '');
create index if not exists audit_created on audit_log (created_at);
`;

const g = globalThis as unknown as { __swReady?: Promise<void> };

async function seed(q: Q) {
  await q(`insert into kv (key, value) values ('settings', $1), ('rates', $2)`, [JSON.stringify(SEED.settings), JSON.stringify(SEED.rates)]);
  for (const kind of ITEM_KINDS) {
    const list = SEED[kind] as unknown as ({ id: string; order?: number } & Record<string, unknown>)[];
    for (let i = 0; i < list.length; i++) {
      const { id, ...data } = list[i];
      await q(`insert into items (kind, id, data, sort) values ($1, $2, $3, $4) on conflict do nothing`, [kind, id, JSON.stringify(data), Number(list[i].order ?? i)]);
    }
  }
  for (const p of PAGE_SEED) await q(`insert into pages (slug, title, body) values ($1, $2, $3) on conflict do nothing`, [p.slug, p.title, p.body]);
}

async function init() {
  const d = await driver();
  await d.query(SCHEMA);
  await d.tx(async (q) => {
    const won = await q(`insert into kv (key, value) values ('seeded', 'true') on conflict do nothing returning key`);
    if (won.length) await seed(q);
  });
  // Optional: create the owner from environment variables (useful on Vercel).
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const pass = process.env.ADMIN_PASSWORD;
  if (email && pass && pass.length >= 8) {
    const n = await d.query<{ n: number }>(`select count(*)::int as n from admins`);
    if (!n[0].n) {
      const { hashPassword } = await import("./password");
      await d.query(`insert into admins (id, name, email, password_hash, role) values ($1, 'Owner', $2, $3, 'owner') on conflict do nothing`, [newId("adm"), email, await hashPassword(pass)]);
    }
  }
}

export async function db(): Promise<{ query: Q; tx: <T>(fn: (q: Q) => Promise<T>) => Promise<T> }> {
  g.__swReady ??= init().catch((e) => { g.__swReady = undefined; throw e; });
  await g.__swReady;
  return driver();
}

/** Call before any write so a disconnected Vercel deployment fails clearly instead of losing data. */
export function assertWritable() {
  if (!isPersistent()) throw new StorageError(READONLY_MSG);
}

/* ------------------------------------------------------------------ settings + items */

async function kvGet<T>(key: string, fallback: T): Promise<T> {
  const r = await (await db()).query<{ value: T }>(`select value from kv where key = $1`, [key]);
  return r[0]?.value ?? fallback;
}
async function kvSet(key: string, value: unknown) {
  assertWritable();
  await (await db()).query(`insert into kv (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value`, [key, JSON.stringify(value)]);
}

export const getSettings = async () => ({ ...SEED.settings, ...(await kvGet<Partial<Settings>>("settings", {})) }) as Settings;
export const getRates = () => kvGet<Rate[]>("rates", SEED.rates);
export const saveSettings = async (s: Partial<Settings>) => kvSet("settings", { ...(await getSettings()), ...s });
export const saveRates = (r: Rate[]) => kvSet("rates", r.map((x) => ({ ...x, perGram: Number(x.perGram) || 0, change: Number(x.change) || 0 })));

type ItemRow = { id: string; data: Record<string, unknown>; sort: number };
const toItem = (r: ItemRow) => ({ ...r.data, id: r.id }) as Record<string, unknown> & { id: string };

export async function listItems<T = Record<string, unknown> & { id: string }>(kind: ItemKind): Promise<T[]> {
  const rows = await (await db()).query<ItemRow>(`select id, data, sort from items where kind = $1 order by sort, created_at desc`, [kind]);
  return rows.map(toItem) as T[];
}

export async function saveItem(kind: ItemKind, item: Record<string, unknown>, isNew: boolean): Promise<(Record<string, unknown> & { id: string }) | null> {
  assertWritable();
  const prefix = { products: "sw", categories: "cat", slides: "sl", collections: "co", brides: "br", stores: "st", testimonials: "t", coupons: "cp" }[kind];
  const id = String(item.id || newId(prefix));
  const { id: _omit, ...data } = item; void _omit;
  const d = await db();
  if (isNew) {
    const exists = await d.query(`select 1 from items where kind = $1 and id = $2`, [kind, id]);
    const finalId = exists.length ? newId(prefix) : id;
    await d.query(`insert into items (kind, id, data, sort) values ($1, $2, $3, $4)`, [kind, finalId, JSON.stringify(data), Number(data.order ?? 0)]);
    return { ...data, id: finalId };
  }
  const cur = await d.query<ItemRow>(`select id, data, sort from items where kind = $1 and id = $2`, [kind, id]);
  if (!cur.length) return null;
  const merged = { ...cur[0].data, ...data };
  await d.query(`update items set data = $3, sort = $4 where kind = $1 and id = $2`, [kind, id, JSON.stringify(merged), Number(merged.order ?? cur[0].sort)]);
  return { ...merged, id };
}

export async function deleteItem(kind: ItemKind, id: string) {
  assertWritable();
  await (await db()).query(`delete from items where kind = $1 and id = $2`, [kind, id]);
}

export async function getItem<T>(kind: ItemKind, id: string): Promise<T | null> {
  const r = await (await db()).query<ItemRow>(`select id, data, sort from items where kind = $1 and id = $2`, [kind, id]);
  return r[0] ? (toItem(r[0]) as T) : null;
}

/** Everything the storefront needs, read once per request. */
export const getPublicData = cache(async (): Promise<PublicData> => {
  const d = await db();
  const [kv, rows] = await Promise.all([
    d.query<{ key: string; value: unknown }>(`select key, value from kv where key in ('settings','rates')`),
    d.query<ItemRow & { kind: string }>(`select kind, id, data, sort from items where kind <> 'coupons' order by sort, created_at desc`),
  ]);
  const by = (k: string) => rows.filter((r) => r.kind === k).map(toItem);
  const settings = { ...SEED.settings, ...((kv.find((x) => x.key === "settings")?.value as Partial<Settings>) ?? {}) } as Settings;
  const rates = (kv.find((x) => x.key === "rates")?.value as Rate[]) ?? SEED.rates;
  return {
    settings, rates,
    products: (by("products") as unknown as Product[]).filter((p) => p.active),
    categories: by("categories") as never,
    slides: (by("slides") as unknown as { active: boolean }[]).filter((s) => s.active) as never,
    collections: by("collections") as never,
    brides: by("brides") as never,
    stores: by("stores") as never,
    testimonials: by("testimonials") as never,
  };
});

/* ------------------------------------------------------------------ orders */

type OrderRow = { id: string; created_at: Date | string; customer_id: string | null; status: OrderStatus; subtotal: number; discount: number; total: number; coupon: string | null; customer: Order["customer"]; items: Order["items"]; notes: string };
const iso = (v: Date | string | null) => (v ? new Date(v).toISOString() : null);
const toOrder = (r: OrderRow): Order => ({
  id: r.id, createdAt: iso(r.created_at)!, customerId: r.customer_id, status: r.status, subtotal: r.subtotal, discount: r.discount, total: r.total,
  coupon: r.coupon ?? undefined, customer: r.customer, items: r.items, notes: r.notes,
});

export async function createOrder(input: { customer: Order["customer"]; lines: { id: string; qty: number; size?: string }[]; coupon?: string; customerId?: string | null }) {
  assertWritable();
  return (await db()).tx(async (q) => {
    const rates = ((await q<{ value: Rate[] }>(`select value from kv where key = 'rates'`))[0]?.value) ?? SEED.rates;
    const items: Order["items"] = [];
    for (const l of input.lines) {
      const r = await q<ItemRow>(`select id, data, sort from items where kind = 'products' and id = $1 for update`, [l.id]);
      if (!r.length) continue;
      const p = toItem(r[0]) as unknown as Product;
      if (!p.active) continue;
      const qty = Math.max(1, Math.min(10, Number(l.qty) || 1));
      items.push({ id: p.id, name: p.name, qty, size: l.size, price: priceOf(p, rates), image: p.images?.[0] });
      await q(`update items set data = jsonb_set(data, '{stock}', to_jsonb(greatest(0, coalesce((data->>'stock')::int, 0) - $2::int))) where kind = 'products' and id = $1`, [p.id, qty]);
    }
    if (!items.length) return null;
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const coupons = (await q<ItemRow>(`select id, data, sort from items where kind = 'coupons'`)).map(toItem) as never;
    const { discount, coupon } = applyCoupon(coupons, input.coupon, subtotal);
    const id = newId("ORD").toUpperCase();
    const rows = await q<OrderRow>(
      `insert into orders (id, customer_id, status, subtotal, discount, total, coupon, customer, items) values ($1,$2,'new',$3,$4,$5,$6,$7,$8) returning *`,
      [id, input.customerId ?? null, subtotal, discount, subtotal - discount, coupon?.code ?? null, JSON.stringify(input.customer), JSON.stringify(items)],
    );
    return toOrder(rows[0]);
  });
}

export async function listOrders(f: { status?: string; q?: string; customerId?: string; from?: string; to?: string; limit?: number } = {}) {
  const where: string[] = [], params: unknown[] = [];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
  if (f.status && f.status !== "all") where.push(`status = ${p(f.status)}`);
  if (f.customerId) where.push(`customer_id = ${p(f.customerId)}`);
  if (f.from) where.push(`created_at >= ${p(f.from)}`);
  if (f.to) where.push(`created_at < ${p(f.to)}`);
  if (f.q) { const v = p(`%${f.q.toLowerCase()}%`); where.push(`(lower(id) like ${v} or lower(customer->>'name') like ${v} or customer->>'phone' like ${v} or lower(customer->>'email') like ${v})`); }
  const rows = await (await db()).query<OrderRow>(`select * from orders ${where.length ? "where " + where.join(" and ") : ""} order by created_at desc limit ${Math.min(f.limit ?? 500, 5000)}`, params);
  return rows.map(toOrder);
}

export async function getOrder(id: string) {
  const r = await (await db()).query<OrderRow>(`select * from orders where id = $1`, [id]);
  return r[0] ? toOrder(r[0]) : null;
}

export async function updateOrder(id: string, patch: { status?: OrderStatus; notes?: string }) {
  assertWritable();
  return (await db()).tx(async (q) => {
    const r = await q<OrderRow>(`select * from orders where id = $1 for update`, [id]);
    if (!r.length) return null;
    const prev = r[0];
    if (patch.status && patch.status !== prev.status && (patch.status === "cancelled" || prev.status === "cancelled")) {
      const sign = patch.status === "cancelled" ? 1 : -1;
      for (const it of prev.items) {
        await q(`update items set data = jsonb_set(data, '{stock}', to_jsonb(greatest(0, coalesce((data->>'stock')::int, 0) + $2::int))) where kind = 'products' and id = $1`, [it.id, sign * it.qty]);
      }
    }
    const out = await q<OrderRow>(`update orders set status = $2, notes = $3 where id = $1 returning *`, [id, patch.status ?? prev.status, patch.notes ?? prev.notes]);
    return toOrder(out[0]);
  });
}

/* ------------------------------------------------------------------ simple tables */

export async function addAppointment(a: Omit<Appointment, "id" | "createdAt" | "status"> & { customerId?: string | null }) {
  assertWritable();
  const r = await (await db()).query<Record<string, unknown>>(
    `insert into appointments (id, store, type, name, phone, date, customer_id) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [newId("ap"), a.store, a.type, a.name, a.phone, a.date, a.customerId ?? null],
  );
  return mapAppt(r[0]);
}
const mapAppt = (r: Record<string, unknown>): Appointment => ({ id: r.id as string, createdAt: iso(r.created_at as string)!, store: r.store as string, type: r.type as "visit", name: r.name as string, phone: r.phone as string, date: r.date as string, status: r.status as "pending" });
export const listAppointments = async () => (await (await db()).query<Record<string, unknown>>(`select * from appointments order by created_at desc limit 1000`)).map(mapAppt);
export async function setAppointmentStatus(id: string, status: string) { assertWritable(); await (await db()).query(`update appointments set status = $2 where id = $1`, [id, status]); }

export async function addSubscriber(email: string) {
  assertWritable();
  await (await db()).query(`insert into subscribers (id, email) values ($1, $2) on conflict (email) do nothing`, [newId("sub"), email]);
}
export const listSubscribers = async (): Promise<Subscriber[]> =>
  (await (await db()).query<{ id: string; email: string; created_at: string }>(`select * from subscribers order by created_at desc`)).map((r) => ({ id: r.id, email: r.email, createdAt: iso(r.created_at)! }));
export async function deleteSubscriber(id: string) { assertWritable(); await (await db()).query(`delete from subscribers where id = $1`, [id]); }

export async function addMessage(m: Omit<Message, "id" | "createdAt" | "status">) {
  assertWritable();
  await (await db()).query(`insert into messages (id, name, email, phone, subject, body) values ($1,$2,$3,$4,$5,$6)`, [newId("msg"), m.name, m.email, m.phone, m.subject, m.body]);
}
export const listMessages = async (): Promise<Message[]> =>
  (await (await db()).query<Record<string, unknown>>(`select * from messages order by created_at desc limit 1000`)).map((r) => ({ ...(r as unknown as Message), createdAt: iso(r.created_at as string)! }));
export async function setMessageStatus(id: string, status: string) { assertWritable(); await (await db()).query(`update messages set status = $2 where id = $1`, [id, status]); }
export async function deleteMessage(id: string) { assertWritable(); await (await db()).query(`delete from messages where id = $1`, [id]); }

const mapReview = (r: Record<string, unknown>): Review => ({ id: r.id as string, createdAt: iso(r.created_at as string)!, productId: r.product_id as string, customerId: (r.customer_id as string) ?? null, name: r.name as string, rating: r.rating as number, title: r.title as string, body: r.body as string, status: r.status as Review["status"] });
export async function addReview(rv: Omit<Review, "id" | "createdAt" | "status">) {
  assertWritable();
  await (await db()).query(`insert into reviews (id, product_id, customer_id, name, rating, title, body) values ($1,$2,$3,$4,$5,$6,$7)`, [newId("rv"), rv.productId, rv.customerId, rv.name, rv.rating, rv.title, rv.body]);
}
export const approvedReviews = async (productId: string) =>
  (await (await db()).query<Record<string, unknown>>(`select * from reviews where product_id = $1 and status = 'approved' order by created_at desc limit 50`, [productId])).map(mapReview);
export const listReviews = async () => (await (await db()).query<Record<string, unknown>>(`select * from reviews order by created_at desc limit 1000`)).map(mapReview);
export async function setReviewStatus(id: string, status: string) { assertWritable(); await (await db()).query(`update reviews set status = $2 where id = $1`, [id, status]); }
export async function deleteReview(id: string) { assertWritable(); await (await db()).query(`delete from reviews where id = $1`, [id]); }

export const listPages = async (): Promise<Page[]> =>
  (await (await db()).query<Record<string, unknown>>(`select * from pages order by slug`)).map((r) => ({ slug: r.slug as string, title: r.title as string, body: r.body as string, updatedAt: iso(r.updated_at as string)! }));
export const getPage = cache(async (slug: string): Promise<Page | null> => (await listPages()).find((p) => p.slug === slug) ?? null);
export async function savePage(p: { slug: string; title: string; body: string }) {
  assertWritable();
  await (await db()).query(`insert into pages (slug, title, body, updated_at) values ($1,$2,$3, now()) on conflict (slug) do update set title = excluded.title, body = excluded.body, updated_at = now()`, [p.slug, p.title, p.body]);
}
export async function deletePage(slug: string) { assertWritable(); await (await db()).query(`delete from pages where slug = $1`, [slug]); }

export async function audit(actor: string, action: string, detail = "") {
  if (!isPersistent()) return;
  try { await (await db()).query(`insert into audit_log (id, actor, action, detail) values ($1,$2,$3,$4)`, [newId("log"), actor, action, detail.slice(0, 500)]); } catch {}
}
export const listAudit = async (): Promise<AuditEntry[]> =>
  (await (await db()).query<Record<string, unknown>>(`select * from audit_log order by created_at desc limit 500`)).map((r) => ({ id: r.id as string, createdAt: iso(r.created_at as string)!, actor: r.actor as string, action: r.action as string, detail: r.detail as string }));

/* ------------------------------------------------------------------ media (uploaded photos live in the database) */

export async function saveMedia(contentType: string, data: Buffer) {
  assertWritable();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await (await db()).query(`insert into media (id, content_type, data, size) values ($1,$2,$3,$4)`, [id, contentType, data, data.length]);
  return id;
}
export async function getMedia(id: string) {
  const r = await (await db()).query<{ content_type: string; data: Buffer | Uint8Array }>(`select content_type, data from media where id = $1`, [id]);
  return r[0] ?? null;
}

/* ------------------------------------------------------------------ customers + admins (rows only; auth logic lives in lib/auth.ts) */

type CustRow = { id: string; name: string; email: string | null; phone: string | null; password_hash: string; session_version: number; addresses: Customer["addresses"]; wishlist: string[]; active: boolean; created_at: string; last_login: string | null };
export const toCustomer = (r: CustRow): Customer => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, addresses: r.addresses ?? [], wishlist: r.wishlist ?? [], active: r.active, createdAt: iso(r.created_at)!, lastLogin: iso(r.last_login) });
export const customerRow = async (where: "id" | "email" | "phone", v: string) => (await (await db()).query<CustRow>(`select * from customers where ${where} = $1`, [v]))[0] ?? null;

export async function listCustomers(q = "") {
  const v = `%${q.toLowerCase()}%`;
  const rows = await (await db()).query<CustRow & { orders: number; spent: number }>(
    `select c.*, coalesce(o.n, 0)::int as orders, coalesce(o.s, 0)::int as spent from customers c
     left join (select customer_id, count(*) n, sum(total) s from orders where status <> 'cancelled' group by customer_id) o on o.customer_id = c.id
     where $1 = '%%' or lower(c.name) like $1 or lower(coalesce(c.email,'')) like $1 or coalesce(c.phone,'') like $1
     order by c.created_at desc limit 2000`, [v]);
  return rows.map((r) => ({ ...toCustomer(r), orders: r.orders, spent: r.spent }));
}

type AdminRow = { id: string; name: string; email: string; password_hash: string; role: Role; active: boolean; session_version: number; created_at: string; last_login: string | null };
export const toAdmin = (r: AdminRow): AdminUser => ({ id: r.id, name: r.name, email: r.email, role: r.role, active: r.active, createdAt: iso(r.created_at)!, lastLogin: iso(r.last_login) });
export const adminRow = async (where: "id" | "email", v: string) => (await (await db()).query<AdminRow>(`select * from admins where ${where} = $1`, [v]))[0] ?? null;
export const listAdmins = async () => (await (await db()).query<AdminRow>(`select * from admins order by created_at`)).map(toAdmin);
export const adminCount = async () => (await (await db()).query<{ n: number }>(`select count(*)::int as n from admins`))[0].n;

/* ------------------------------------------------------------------ backup */

export async function exportAll(): Promise<DB> {
  const pd = await Promise.all(ITEM_KINDS.map((k) => listItems(k)));
  const items = Object.fromEntries(ITEM_KINDS.map((k, i) => [k, pd[i]]));
  return {
    settings: await getSettings(), rates: await getRates(), ...(items as Record<string, unknown>),
    orders: await listOrders({ limit: 5000 }), appointments: await listAppointments(), subscribers: await listSubscribers(),
    pages: await listPages(), reviews: await listReviews(), messages: await listMessages(),
  } as DB;
}

export async function importAll(data: DB) {
  assertWritable();
  await (await db()).tx(async (q) => {
    if (data.settings) await q(`insert into kv (key, value) values ('settings', $1) on conflict (key) do update set value = excluded.value`, [JSON.stringify(data.settings)]);
    if (data.rates) await q(`insert into kv (key, value) values ('rates', $1) on conflict (key) do update set value = excluded.value`, [JSON.stringify(data.rates)]);
    for (const kind of ITEM_KINDS) {
      const list = data[kind] as unknown as ({ id: string; order?: number } & Record<string, unknown>)[] | undefined;
      if (!Array.isArray(list)) continue;
      await q(`delete from items where kind = $1`, [kind]);
      for (let i = 0; i < list.length; i++) {
        const { id, ...rest } = list[i];
        await q(`insert into items (kind, id, data, sort) values ($1,$2,$3,$4)`, [kind, id, JSON.stringify(rest), Number(list[i].order ?? i)]);
      }
    }
    if (Array.isArray(data.orders)) for (const o of data.orders) {
      await q(`insert into orders (id, created_at, customer_id, status, subtotal, discount, total, coupon, customer, items, notes) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
               on conflict (id) do update set status = excluded.status, notes = excluded.notes`,
        [o.id, o.createdAt, o.customerId ?? null, o.status, Math.round(o.subtotal), Math.round(o.discount), Math.round(o.total), o.coupon ?? null, JSON.stringify(o.customer), JSON.stringify(o.items), o.notes ?? ""]);
    }
    if (Array.isArray(data.pages)) for (const p of data.pages) await q(`insert into pages (slug, title, body) values ($1,$2,$3) on conflict (slug) do update set title = excluded.title, body = excluded.body`, [p.slug, p.title, p.body]);
    if (Array.isArray(data.subscribers)) for (const s of data.subscribers) await q(`insert into subscribers (id, email, created_at) values ($1,$2,$3) on conflict do nothing`, [s.id, s.email, s.createdAt]);
  });
}
