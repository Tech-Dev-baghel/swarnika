import Link from "next/link";
import { notFound } from "next/navigation";
import Invoice from "@/components/Invoice";
import PrintButton from "@/components/admin/PrintButton";
import { accountUser } from "@/lib/auth";
import { getOrder, getSettings, listItems } from "@/lib/db";
import type { Product } from "@/lib/types";

export default async function MyInvoice({ params }: { params: Promise<{ id: string }> }) {
  const me = await accountUser();
  const { id } = await params;
  const [o, s, products] = await Promise.all([getOrder(id), getSettings(), listItems<Product>("products")]);
  if (!o || o.customerId !== me.id) notFound();
  const hsn = Object.fromEntries(products.map((p) => [p.id, p.hsn ?? ""]));
  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/account/orders/${o.id}`} className="text-sm text-wine-700">← Back to order</Link>
        <PrintButton />
      </div>
      <Invoice o={o} s={s} hsnOf={(pid) => hsn[pid] ?? ""} />
    </div>
  );
}
