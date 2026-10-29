import { ReviewsManager } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
import { listItems, listReviews } from "@/lib/db";
import type { Product } from "@/lib/types";
export default async function Page() {
  await adminPage("reviews");
  const products = await listItems<Product>("products");
  return <ReviewsManager initial={await listReviews()} names={Object.fromEntries(products.map((p) => [p.id, p.name]))} />;
}
