import { OrdersManager } from "@/components/admin/Managers";
import { adminPage } from "@/lib/admin-guard";
import { listOrders } from "@/lib/db";
import { dtdcEnabled } from "@/lib/dtdc";

export default async function Page() {
  const me = await adminPage("orders");
  return <OrdersManager initial={await listOrders({ limit: 1000 })} dtdc={dtdcEnabled()} canRefund={me.role !== "staff"} />;
}
