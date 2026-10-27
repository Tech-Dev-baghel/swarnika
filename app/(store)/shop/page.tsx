import { Suspense } from "react";
import ShopClient from "./ShopClient";

export const metadata = { title: "Shop Jewellery — Swarnika Jewels" };

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-20 md:grid-cols-4">{[...Array(8)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}</div>}>
      <ShopClient />
    </Suspense>
  );
}
