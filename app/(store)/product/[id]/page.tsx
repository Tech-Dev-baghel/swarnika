import { notFound } from "next/navigation";
import { getPublicData } from "@/lib/db";
import { img, priceOf } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";
import ProductClient from "./ProductClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { products, settings } = await getPublicData();
  const p = products.find((x) => x.id === id);
  if (!p) return { title: "Not found" };
  const images = p.images[0] ? [img(p.images[0], 1200)] : undefined;
  return { title: `${p.name} — ${settings.brandName} Jewels`, description: p.description, alternates: { canonical: `/product/${p.id}` }, openGraph: { title: p.name, description: p.description, images } };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { products, rates, settings } = await getPublicData();
  const p = products.find((x) => x.id === id);
  if (!p) notFound();
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.id, description: p.description,
    image: p.images.map((u) => img(u, 1200)), brand: { "@type": "Brand", name: settings.brandName },
    aggregateRating: p.reviews ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews } : undefined,
    offers: { "@type": "Offer", priceCurrency: "INR", price: priceOf(p, rates), availability: "https://schema.org/InStock", url: `${SITE_URL}/product/${p.id}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <ProductClient id={id} />
    </>
  );
}
