import { currentCustomer } from "@/lib/auth";
import { getPublicData } from "@/lib/db";
import { DataProvider } from "@/lib/data-context";
import { StoreProvider } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Overlays from "@/components/Overlays";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [data, me] = await Promise.all([getPublicData(), currentCustomer()]);
  const customer = me ? { id: me.id, name: me.name, wishlist: me.wishlist } : null;
  return (
    <DataProvider data={data}>
      <StoreProvider customer={customer}>
        <Header />
        <main>{children}</main>
        <Footer />
        <Overlays />
      </StoreProvider>
    </DataProvider>
  );
}
