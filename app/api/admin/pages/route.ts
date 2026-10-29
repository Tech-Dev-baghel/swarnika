import { revalidatePath } from "next/cache";
import { bad, isResponse, json, requireAdmin, str, withStore } from "@/lib/api";
import { audit, deletePage, savePage } from "@/lib/db";

const PROTECTED = ["about", "faq", "shipping", "returns", "privacy", "terms"];

async function _PUT(req: Request) {
  const me = await requireAdmin("content"); if (isResponse(me)) return me;
  const b = await req.json().catch(() => ({}));
  const slug = str(b.slug, 60).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!slug || !str(b.title, 120)) return bad("Each page needs a title and a link name.");
  await savePage({ slug, title: str(b.title, 120), body: String(b.body ?? "").slice(0, 50_000) });
  await audit(me.email, `Saved page /${slug}`);
  revalidatePath("/", "layout");
  return json({ ok: true, slug });
}
async function _DELETE(req: Request) {
  const me = await requireAdmin("content"); if (isResponse(me)) return me;
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (PROTECTED.includes(slug)) return bad("This is one of the main pages linked in the footer — edit it instead of deleting.");
  await deletePage(slug);
  await audit(me.email, `Deleted page /${slug}`);
  revalidatePath("/", "layout");
  return json({ ok: true });
}
export const PUT = withStore(_PUT);
export const DELETE = withStore(_DELETE);
