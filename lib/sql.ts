import "server-only";
import path from "path";

/*
 * Database connection.
 *  - DATABASE_URL / POSTGRES_URL set (Vercel → Storage → Neon): real Postgres via `pg`.
 *  - Otherwise on your PC: PGlite, a full Postgres that runs inside Node and saves to data/pglite.
 *  - Otherwise on Vercel (nothing connected): PGlite in memory with demo data — nothing is kept,
 *    so writes are refused (see `isPersistent`).
 */
type Row = Record<string, unknown>;
export type Q = <T = Row>(text: string, params?: unknown[]) => Promise<T[]>;
type Driver = { kind: "postgres" | "pglite" | "memory"; query: Q; tx: <T>(fn: (q: Q) => Promise<T>) => Promise<T> };

const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const dbKind = (): Driver["kind"] => (URL ? "postgres" : process.env.VERCEL ? "memory" : "pglite");
export const isPersistent = () => dbKind() !== "memory";

const g = globalThis as unknown as { __swDriver?: Promise<Driver> };

async function makePg(): Promise<Driver> {
  const { Pool } = await import("pg");
  const local = /localhost|127\.0\.0\.1/.test(URL);
  const pool = new Pool({
    connectionString: URL.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, ""),
    ssl: local ? undefined : { rejectUnauthorized: false },
    max: process.env.VERCEL ? 3 : 10,
    idleTimeoutMillis: 10_000,
  });
  const query: Q = async (text, params) => (await pool.query(text, params as unknown[])).rows as never;
  return {
    kind: "postgres",
    query,
    tx: async (fn) => {
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const out = await fn(async (t, p) => (await c.query(t, p as unknown[])).rows as never);
        await c.query("COMMIT");
        return out;
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        c.release();
      }
    },
  };
}

async function makePglite(memory: boolean): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  let dir = "";
  if (!memory) {
    dir = path.join(process.cwd(), "data", "pglite");
    (await import("fs")).mkdirSync(dir, { recursive: true });
  }
  const db = memory ? new PGlite() : new PGlite(dir);
  await db.waitReady;
  // Parameterless text may hold several statements (the schema); PGlite needs exec() for that.
  const query: Q = async (text, params) =>
    (params?.length ? (await db.query(text, params as unknown[])).rows : ((await db.exec(text)).at(-1)?.rows ?? [])) as never;
  return {
    kind: memory ? "memory" : "pglite",
    query,
    tx: (fn) => db.transaction((t) => fn(async (text, params) =>
      (params?.length ? (await t.query(text, params as unknown[])).rows : ((await t.exec(text)).at(-1)?.rows ?? [])) as never)),
  };
}

export function driver(): Promise<Driver> {
  g.__swDriver ??= (dbKind() === "postgres" ? makePg() : makePglite(dbKind() === "memory")).catch((e) => {
    g.__swDriver = undefined;
    throw e;
  });
  return g.__swDriver;
}
