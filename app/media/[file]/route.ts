import { promises as fs } from "fs";
import path from "path";
import { getMedia } from "@/lib/db";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };
const headers = (type: string) => ({ "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" });

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[\w.-]+$/.test(file)) return new Response("Not found", { status: 404 });
  const m = await getMedia(file).catch(() => null);
  if (m) return new Response(new Uint8Array(m.data), { headers: headers(m.content_type) });
  // Photos uploaded with the older version were saved in data/uploads.
  try {
    const buf = await fs.readFile(path.join(process.cwd(), "data", "uploads", file));
    return new Response(new Uint8Array(buf), { headers: headers(TYPES[file.split(".").pop()!.toLowerCase()] ?? "application/octet-stream") });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
