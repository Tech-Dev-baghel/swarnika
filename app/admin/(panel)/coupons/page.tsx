import ResourceManager from "@/components/admin/ResourceManager";
import { adminPage } from "@/lib/admin-guard";
import { getRates, listItems } from "@/lib/db";

export default async function Page() {
  await adminPage("marketing");
  const [rows, categories, rates] = await Promise.all([listItems("coupons"), listItems("categories"), getRates()]);
  return <ResourceManager kind="coupons" initial={rows as never} extra={{ categories: categories as never, rates }} />;
}
