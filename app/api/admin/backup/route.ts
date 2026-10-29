import { revalidatePath } from "next/cache";
import { bad, isResponse, json, requireAdmin, withStore } from "@/lib/api";
import { audit, exportAll, importAll } from "@/lib/db";
import type { DB } from "@/lib/types";

async function _GET() {
  const me = await requireAdmin("backup"); if (isResponse(me)) return me;
  const data = await exportAll();
  await audit(me.email, "Downloaded backup");
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="store-backup-${new Date().toISOString().slice(0, 10)}.json"` },
  });
}
async function _POST(req: Request) {
  const me = await requireAdmin("backup"); if (isResponse(me)) return me;
  const data = (await req.json().catch(() => null)) as DB | null;
  if (!data || typeof data !== "object" || !data.settings || !Array.isArray(data.products) || !Array.isArray(data.rates)) return bad("That file isn't a store backup");
  await importAll(data);
  await audit(me.email, "Restored a backup");
  revalidatePath("/", "layout");
  return json({ ok: true });
}
export const GET = withStore(_GET);
export const POST = withStore(_POST);
