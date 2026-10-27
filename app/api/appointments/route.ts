import { bad, json } from "@/lib/api";
import { mutate, newId } from "@/lib/db";
import { appointmentEmail } from "@/lib/mail";
import { clientIp, limited } from "@/lib/ratelimit";

const s = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);

export async function POST(req: Request) {
  if (limited("appt:" + clientIp(req), 10, 10 * 60 * 1000)) return bad("Too many requests. Please call the store instead.", 429);
  const b = await req.json().catch(() => ({}));
  const name = s(b.name, 80), phone = s(b.phone, 20), store = s(b.store), date = s(b.date, 40);
  const type: "video" | "visit" = b.type === "video" ? "video" : "visit";
  if (!name || !/^[0-9+\- ]{10,15}$/.test(phone) || !store) return bad("Please add your name and a valid phone number.");
  await mutate((db) => {
    const a = { id: newId("ap"), createdAt: new Date().toISOString(), store, type, name, phone, date, status: "pending" as const };
    db.appointments.unshift(a);
    appointmentEmail(a, db.settings.email);
  });
  return json({ ok: true }, 201);
}
