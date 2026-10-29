import { OrdersManager } from "@/components/admin/Managers";
import { adminPage } from "@/lib/admin-guard";
import { listOrders } from "@/lib/db";
export default async function Page() { await adminPage("orders"); return <OrdersManager initial={await listOrders({ limit: 1000 })} />; }
