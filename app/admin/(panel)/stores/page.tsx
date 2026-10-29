import ResourceManager from "@/components/admin/ResourceManager";
import { adminPage } from "@/lib/admin-guard";
import { getRates, listItems } from "@/lib/db";

export default async function Page() {
  await adminPage("content");
  const [rows, categories, rates] = await Promise.all([listItems("stores"), listItems("categories"), getRates()]);
  return <ResourceManager kind="stores" initial={rows as never} extra={{ categories: categories as never, rates }} />;
}
