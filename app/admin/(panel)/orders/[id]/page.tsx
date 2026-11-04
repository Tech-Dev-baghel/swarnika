import Link from "next/link";
import { notFound } from "next/navigation";
import Invoice from "@/components/Invoice";
import PrintButton from "@/components/admin/PrintButton";
import { adminPage } from "@/lib/admin-guard";
import { getOrder, getSettings, listItems } from "@/lib/db";
import type { Product } from "@/lib/types";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage("orders");
  const { id } = await params;
  const [o, s, products] = await Promise.all([getOrder(id), getSettings(), listItems<Product>("products")]);
  if (!o) notFound();
  const hsn = Object.fromEntries(products.map((p) => [p.id, p.hsn ?? ""]));
  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin/orders" className="text-sm text-amber-700">← All orders</Link>
        <PrintButton />
      </div>
      <Invoice o={o} s={s} hsnOf={(pid) => hsn[pid] ?? ""} />
      {o.notes && <p className="mx-auto mt-4 max-w-3xl rounded-lg bg-stone-50 p-3 text-xs text-stone-600 print:hidden">Notes: {o.notes}</p>}
    </div>
  );
}
