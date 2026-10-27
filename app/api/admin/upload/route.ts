import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { bad, guard, json, withStore } from "@/lib/api";
import { put } from "@vercel/blob";
import { READONLY_MSG, UPLOAD_DIR } from "@/lib/db";

const OK: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

async function _POST(req: Request) {
  const denied = await guard(); if (denied) return denied;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return bad("No file");
  const ext = OK[file.type];
  if (!ext) return bad("Only JPG, PNG, WEBP, GIF or AVIF images");
  const serverless = Boolean(process.env.VERCEL);
  const maxMb = serverless ? 4 : 8; // Vercel rejects request bodies over ~4.5 MB
  if (file.size > maxMb * 1024 * 1024) return bad(`Image must be under ${maxMb} MB`);
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

  // On Vercel (or anywhere BLOB_READ_WRITE_TOKEN is set) photos go to Vercel Blob storage.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${name}`, file, { access: "public", contentType: file.type });
    return json({ url: blob.url }, 201);
  }
  if (serverless) return bad("Photo uploads need Vercel Blob storage. In Vercel open Storage → create a Blob store → connect it to this project, then redeploy. (You can paste an image link instead.)", 503);

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  } catch {
    return bad(READONLY_MSG, 503);
  }
  return json({ url: `/media/${name}` }, 201);
}

export const POST = withStore(_POST);
