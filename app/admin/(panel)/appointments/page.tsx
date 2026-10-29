import { AppointmentsManager } from "@/components/admin/Managers";
import { adminPage } from "@/lib/admin-guard";
import { listAppointments } from "@/lib/db";
export default async function Page() { await adminPage("appointments"); return <AppointmentsManager initial={await listAppointments()} />; }
