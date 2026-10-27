import ResourceManager from "@/components/admin/ResourceManager";
import { getDB } from "@/lib/db";

export default async function Page() {
  const db = await getDB();
  return <ResourceManager kind="products" initial={db.products as never} extra={{ categories: db.categories, rates: db.rates }} />;
}
