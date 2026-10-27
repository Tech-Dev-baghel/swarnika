import type { MetadataRoute } from "next";
import { getPublicData } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getPublicData();
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/gold-rate`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/stores`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...categories.map((c) => ({ url: `${SITE_URL}/shop?category=${c.slug}`, lastModified: now, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.id}`, lastModified: now, priority: 0.7 })),
  ];
}
