import "server-only";
import { normEmail, normPhone } from "./api";
import { customerRow } from "./db";

/** Finds a customer by email or 10-digit phone. */
export async function findCustomer(identifier: string) {
  const id = String(identifier ?? "").trim();
  if (id.includes("@")) return customerRow("email", normEmail(id));
  const p = normPhone(id);
  return p ? customerRow("phone", p) : null;
}
