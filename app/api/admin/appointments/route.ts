import { bad, isResponse, json, requireAdmin, str, withStore } from "@/lib/api";
import { audit, setAppointmentStatus } from "@/lib/db";

async function _PUT(req: Request) {
  const me = await requireAdmin("appointments"); if (isResponse(me)) return me;
  const b = await req.json().catch(() => ({}));
  if (!["pending", "confirmed", "done", "cancelled"].includes(b.status)) return bad("Unknown status");
  await setAppointmentStatus(str(b.id, 60), b.status);
  await audit(me.email, `Appointment ${b.id} → ${b.status}`);
  return json({ ok: true });
}
export const PUT = withStore(_PUT);
