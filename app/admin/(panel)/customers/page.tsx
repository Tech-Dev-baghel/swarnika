import { CustomersManager } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
import { listCustomers } from "@/lib/db";
export default async function Page() { await adminPage("customers"); return <CustomersManager initial={await listCustomers()} />; }
