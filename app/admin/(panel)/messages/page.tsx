import { MessagesManager } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
import { listMessages } from "@/lib/db";
export default async function Page() { await adminPage("messages"); return <MessagesManager initial={await listMessages()} />; }
