import { SettingsForm } from "@/components/admin/Managers";
import { adminPage } from "@/lib/admin-guard";
import { getRates, getSettings } from "@/lib/db";
export default async function Page() { await adminPage("settings"); return <SettingsForm initial={{ settings: await getSettings(), rates: await getRates() }} />; }
