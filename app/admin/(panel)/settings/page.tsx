import { SettingsForm } from "@/components/admin/Managers";
import { getDB } from "@/lib/db";
export default async function Page() { const db = await getDB(); return <SettingsForm initial={{ settings: db.settings, rates: db.rates }} />; }
