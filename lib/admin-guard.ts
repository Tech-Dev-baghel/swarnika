import "server-only";
import { redirect } from "next/navigation";
import { can, currentAdmin, type Section } from "./auth";
import { adminCount } from "./db";

/** Use at the top of each admin page. Sends people to setup/login, or back to the dashboard if their role can't open it. */
export async function adminPage(section: Section) {
  const me = await currentAdmin();
  if (!me) redirect((await adminCount()) === 0 ? "/admin/setup" : "/admin/login");
  if (!can(me.role, section)) redirect("/admin?denied=" + section);
  return me;
}
