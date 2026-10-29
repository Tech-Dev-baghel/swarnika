import { revalidatePath } from "next/cache";
import { bad, isResponse, json, requireAdmin, str, withStore } from "@/lib/api";
import { audit, deleteReview, setReviewStatus } from "@/lib/db";

async function _PUT(req: Request) {
  const me = await requireAdmin("reviews"); if (isResponse(me)) return me;
  const b = await req.json().catch(() => ({}));
  if (!["pending", "approved", "rejected"].includes(b.status)) return bad("Unknown status");
  await setReviewStatus(str(b.id, 60), b.status);
  await audit(me.email, `Review ${b.id} → ${b.status}`);
  revalidatePath("/", "layout");
  return json({ ok: true });
}
async function _DELETE(req: Request) {
  const me = await requireAdmin("reviews"); if (isResponse(me)) return me;
  await deleteReview(new URL(req.url).searchParams.get("id") ?? "");
  revalidatePath("/", "layout");
  return json({ ok: true });
}
export const PUT = withStore(_PUT);
export const DELETE = withStore(_DELETE);
