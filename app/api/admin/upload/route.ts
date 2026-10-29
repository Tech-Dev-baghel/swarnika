import { bad, isResponse, json, requireAdmin, withStore } from "@/lib/api";
import { saveMedia } from "@/lib/db";

const OK = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Photos are stored in the database (no separate file storage needed) and served from /media/<id>. */
async function _POST(req: Request) {
  const me = await requireAdmin("products"); if (isResponse(me)) return me;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return bad("No file");
  if (!OK.includes(file.type)) return bad("Only JPG, PNG, WEBP, GIF or AVIF images");
  const max = process.env.VERCEL ? 4 : 8; // Vercel rejects uploads over ~4.5 MB
  if (file.size > max * 1024 * 1024) return bad(`Image must be under ${max} MB (tip: export photos at 1600px wide).`);
  const id = await saveMedia(file.type, Buffer.from(await file.arrayBuffer()));
  return json({ url: `/media/${id}` }, 201);
}
export const POST = withStore(_POST);
