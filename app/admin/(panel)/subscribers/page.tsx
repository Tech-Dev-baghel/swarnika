import { SubscribersManager } from "@/components/admin/Managers";
import { getDB } from "@/lib/db";
export default async function Page() { return <SubscribersManager initial={(await getDB()).subscribers} />; }
