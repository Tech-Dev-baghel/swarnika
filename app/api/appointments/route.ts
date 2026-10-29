import { bad, json, str, withStore } from "@/lib/api";
import { currentCustomer } from "@/lib/auth";
import { addAppointment, getSettings } from "@/lib/db";
import { appointmentEmail } from "@/lib/mail";
import { clientIp, limited } from "@/lib/ratelimit";

async function _POST(req: Request) {
  if (limited("appt:" + clientIp(req), 10, 10 * 60 * 1000)) return bad("Too many requests. Please call the store instead.", 429);
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80), phone = str(b.phone, 20), store = str(b.store), date = str(b.date, 40);
  const type: "video" | "visit" = b.type === "video" ? "video" : "visit";
  if (!name || !/^[0-9+\- ]{10,16}$/.test(phone) || !store) return bad("Please add your name and a valid phone number.");
  const me = await currentCustomer();
  const a = await addAppointment({ store, type, name, phone, date, customerId: me?.id ?? null });
  appointmentEmail(a, (await getSettings()).email);
  return json({ ok: true }, 201);
}
export const POST = withStore(_POST);
