import { ProfileForm } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
export default async function Page() { const me = await adminPage("dashboard"); return <ProfileForm me={me} />; }
