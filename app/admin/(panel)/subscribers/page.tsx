import { SubscribersManager } from "@/components/admin/Managers";
import { adminPage } from "@/lib/admin-guard";
import { listSubscribers } from "@/lib/db";
export default async function Page() { await adminPage("marketing"); return <SubscribersManager initial={await listSubscribers()} />; }
