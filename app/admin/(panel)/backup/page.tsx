import BackupPanel from "@/components/admin/BackupPanel";
import { adminPage } from "@/lib/admin-guard";
export default async function Page() { await adminPage("backup"); return <BackupPanel />; }
