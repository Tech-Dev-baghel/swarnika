import { AppointmentsManager } from "@/components/admin/Managers";
import { getDB } from "@/lib/db";
export default async function Page() { return <AppointmentsManager initial={(await getDB()).appointments} />; }
