import "server-only";

const hits = new Map<string, number[]>();

function recent(key: string, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return arr;
}

/** Records an attempt for `key` and returns true if there were more than `max` within `windowMs`. */
export function limited(key: string, max: number, windowMs: number) {
  const arr = recent(key, windowMs);
  arr.push(Date.now());
  return arr.length > max;
}

/** Checks without recording — pair with `record()` to count only failures. */
export const tooMany = (key: string, max: number, windowMs: number) => recent(key, windowMs).length >= max;
export const record = (key: string) => { const a = hits.get(key) ?? []; a.push(Date.now()); hits.set(key, a); };
export const clear = (key: string) => hits.delete(key);

export const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
