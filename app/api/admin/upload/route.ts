import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { bad, guard, json } from "@/lib/api";
import { UPLOAD_DIR } from "@/lib/db";

const OK: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

export async function POST(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return bad("No file");
  const ext = OK[file.type];
  if (!ext) return bad("Only JPG, PNG, WEBP, GIF or AVIF images");
  if (file.size > 8 * 1024 * 1024) return bad("Image must be under 8 MB");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return json({ url: `/media/${name}` }, 201);
}
