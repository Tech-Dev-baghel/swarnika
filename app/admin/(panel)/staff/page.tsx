import { StaffManager } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
import { listAdmins } from "@/lib/db";
export default async function Page() { const me = await adminPage("staff"); return <StaffManager initial={await listAdmins()} meId={me.id} />; }
