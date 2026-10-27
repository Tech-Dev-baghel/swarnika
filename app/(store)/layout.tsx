import { getPublicData } from "@/lib/db";
import { DataProvider } from "@/lib/data-context";
import { StoreProvider } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Overlays from "@/components/Overlays";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const data = await getPublicData();
  return (
    <DataProvider data={data}>
      <StoreProvider>
        <Header />
        <main>{children}</main>
        <Footer />
        <Overlays />
      </StoreProvider>
    </DataProvider>
  );
}
