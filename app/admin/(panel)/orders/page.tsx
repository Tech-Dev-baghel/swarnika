import { OrdersManager } from "@/components/admin/Managers";
import { getDB } from "@/lib/db";
export default async function Page() { return <OrdersManager initial={(await getDB()).orders} />; }
