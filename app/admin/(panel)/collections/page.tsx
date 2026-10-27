import ResourceManager from "@/components/admin/ResourceManager";
import { getDB } from "@/lib/db";

export default async function Page() {
  const db = await getDB();
  return <ResourceManager kind="collections" initial={db.collections as never} extra={{ categories: db.categories, rates: db.rates }} />;
}
