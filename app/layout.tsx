import type { Metadata } from "next";
import "./globals.css";
import MotionRoot from "@/components/MotionRoot";
import { getPublicData } from "@/lib/db";
import { img } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

// Every page reads live store data (prices, settings), so never serve a stale pre-built copy.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings, slides } = await getPublicData();
  const title = `${settings.brandName} Jewels — Gold, Diamond & Bridal Jewellery`;
  const description = `Hallmarked gold, certified diamonds and bridal jewellery. Shop online or visit a ${settings.brandName} store.`;
  const image = slides[0]?.image ? img(slides[0].image, 1200) : undefined;
  return {
    metadataBase: new URL(SITE_URL),
    title, description,
    openGraph: { title, description, type: "website", siteName: `${settings.brandName} Jewels`, images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}
