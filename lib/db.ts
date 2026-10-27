import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { SEED } from "./seed";
import type { DB, PublicData } from "./types";

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "db.json");
export const UPLOAD_DIR = path.join(DIR, "uploads");

let cache: DB | null = null;
let queue: Promise<unknown> = Promise.resolve();
let creating: Promise<DB> | null = null;

async function load(): Promise<DB> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const db = JSON.parse(raw) as DB;
    // fill any collections added in later versions
    for (const k of Object.keys(SEED) as (keyof DB)[]) if (db[k] === undefined) (db as Record<string, unknown>)[k] = structuredClone(SEED[k]);
    db.settings = { ...SEED.settings, ...db.settings }; // new settings fields get defaults
    return db;
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    // First run: create the database once, even if several requests arrive together.
    creating ??= (async () => { const db = structuredClone(SEED); await write(db); return db; })();
    return structuredClone(await creating);
  }
}

async function write(db: DB) {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
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
