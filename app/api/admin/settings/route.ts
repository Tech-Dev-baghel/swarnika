import { revalidatePath } from "next/cache";
import { isResponse, json, requireAdmin, withStore } from "@/lib/api";
import { audit, getRates, getSettings, saveRates, saveSettings } from "@/lib/db";
import type { Rate, Settings } from "@/lib/types";

async function _GET() {
  const me = await requireAdmin("settings"); if (isResponse(me)) return me;
  return json({ settings: await getSettings(), rates: await getRates() });
}
async function _PUT(req: Request) {
  const me = await requireAdmin("settings"); if (isResponse(me)) return me;
  const body = (await req.json()) as { settings?: Partial<Settings>; rates?: Rate[] };
  if (body.settings) await saveSettings(body.settings);
  if (body.rates) await saveRates(body.rates);
  await audit(me.email, "Updated settings / gold rates", body.rates ? body.rates.map((r) => `${r.purity}=${r.perGram}`).join(" ") : "");
  revalidatePath("/", "layout");
  return json({ settings: await getSettings(), rates: await getRates() });
}
export const GET = withStore(_GET);
export const PUT = withStore(_PUT);
