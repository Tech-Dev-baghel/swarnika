import { PagesManager } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
import { listPages } from "@/lib/db";
export default async function Page() { await adminPage("content"); return <PagesManager initial={await listPages()} />; }
