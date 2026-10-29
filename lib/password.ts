import "server-only";
import crypto from "crypto";

const KEYLEN = 64;
const N = 16384;

export function hashPassword(pw: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  return new Promise((res, rej) =>
    crypto.scrypt(pw, salt, KEYLEN, { N }, (e, key) => (e ? rej(e) : res(`scrypt$${N}$${salt.toString("hex")}$${key.toString("hex")}`))),
  );
}

export function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, n, saltHex, keyHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !keyHex) return Promise.resolve(false);
  return new Promise((res) =>
    crypto.scrypt(pw, Buffer.from(saltHex, "hex"), KEYLEN, { N: Number(n) }, (e, key) => {
      if (e) return res(false);
      const want = Buffer.from(keyHex, "hex");
      res(want.length === key.length && crypto.timingSafeEqual(want, key));
    }),
  );
}

/** Basic strength rule shown to users: at least 8 characters with a letter and a number. */
export const passwordProblem = (pw: string) =>
  pw.length < 8 ? "Password must be at least 8 characters." : !/[a-zA-Z]/.test(pw) || !/\d/.test(pw) ? "Use at least one letter and one number." : null;
