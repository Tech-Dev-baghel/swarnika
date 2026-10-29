import { ProfileForms } from "@/components/AccountForms";
import { accountUser } from "@/lib/auth";
export default async function Page() { const me = await accountUser(); return <ProfileForms me={me} />; }
