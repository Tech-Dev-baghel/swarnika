import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { SEED } from "./seed";
import type { DB, PublicData } from "./types";

/*
 * Where the store's data lives:
 *  - "redis": Upstash Redis (Vercel → Storage → Upstash/KV). Used when KV_REST_API_URL/TOKEN
 *    or UPSTASH_REDIS_REST_URL/TOKEN are set. Required on Vercel and other serverless hosts.
 *  - "file":  data/db.json on disk. Used on your PC or a VPS.
 *  - "readonly": on Vercel with no database connected. The site shows the demo content,
 *    but saving (admin edits, orders, bookings) is refused with a clear message.
 */
const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "db.json");
export const UPLOAD_DIR = path.join(DIR, "uploads");
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const REDIS_KEY = process.env.DB_KEY || "swarnika:db";

export type StorageMode = "redis" | "file" | "readonly";
export const storageMode = (): StorageMode => (REDIS_URL && REDIS_TOKEN ? "redis" : process.env.VERCEL ? "readonly" : "file");

export class StorageError extends Error {}
export const READONLY_MSG = "The website isn't connected to a database yet, so changes can't be saved. In Vercel open Storage → create an Upstash Redis (KV) database → connect it to this project, then redeploy.";

let cache: DB | null = null;
let queue: Promise<unknown> = Promise.resolve();
let creating: Promise<DB> | null = null;

async function redis(cmd: unknown[]) {
  const r = await fetch(REDIS_URL, {
    method: "POST", cache: "no-store",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = (await r.json().catch(() => ({}))) as { result?: unknown; error?: string };
  if (!r.ok || j.error) throw new StorageError(`Database error: ${j.error ?? r.status}`);
  return j.result;
}

function upgrade(db: DB): DB {
  // fill any collections / settings added in later versions
  for (const k of Object.keys(SEED) as (keyof DB)[]) if (db[k] === undefined) (db as Record<string, unknown>)[k] = structuredClone(SEED[k]);
  db.settings = { ...SEED.settings, ...db.settings };
  return db;
}

async function readRaw(): Promise<string | null> {
  const mode = storageMode();
  if (mode === "redis") return ((await redis(["GET", REDIS_KEY])) as string | null) ?? null;
  if (mode === "readonly") return null;
  try {
    return await fs.readFile(FILE, "utf8");
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

async function load(): Promise<DB> {
  const raw = await readRaw();
  if (raw) return upgrade(JSON.parse(raw) as DB);
  if (storageMode() === "readonly") return structuredClone(SEED);
  // First run: create the database once, even if several requests arrive together.
  creating ??= (async () => {
    const db = structuredClone(SEED);
    try { await write(db); } catch (e) {
      // Read-only disk (e.g. a serverless host without a database): show the demo content instead of crashing.
      if (["EROFS", "EACCES", "EPERM", "ENOTDIR"].includes((e as NodeJS.ErrnoException).code ?? "")) { creating = null; return db; }
      throw e;
    }
    return db;
  })();
  return structuredClone(await creating);
}

async function write(db: DB) {
  const mode = storageMode();
  if (mode === "readonly") throw new StorageError(READONLY_MSG);
  if (mode === "redis") { await redis(["SET", REDIS_KEY, JSON.stringify(db)]); return; }
  try { await fs.mkdir(DIR, { recursive: true }); } catch (e) { throw diskError(e); }
  const tmp = `${FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, FILE);
  } catch (e) { throw diskError(e); }
}

function diskError(e: unknown) {
  const code = (e as NodeJS.ErrnoException).code ?? "";
  return ["EROFS", "EACCES", "EPERM", "ENOTDIR"].includes(code) ? Object.assign(new StorageError(READONLY_MSG), { code }) : e;
}

export async function getDB(): Promise<DB> {
  // Always re-read so edits made by another process (or by hand) show up.
  cache = await load();
  return cache;
}

/** Serialised read-modify-write so concurrent requests can't clobber each other. */
export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const out = await fn(db);
    await write(db);
    cache = db;
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function getPublicData(): Promise<PublicData> {
  const db = await getDB();
  const byOrder = <T extends { order: number }>(a: T[]) => [...a].sort((x, y) => x.order - y.order);
  return {
    settings: db.settings,
    rates: db.rates,
    products: db.products.filter((p) => p.active),
    categories: byOrder(db.categories),
    slides: byOrder(db.slides).filter((s) => s.active),
    collections: byOrder(db.collections),
    brides: byOrder(db.brides),
    stores: db.stores,
    testimonials: db.testimonials,
  };
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
