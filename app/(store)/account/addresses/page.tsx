import { AddressBook } from "@/components/AccountForms";
import { accountUser } from "@/lib/auth";
export default async function Page() { const me = await accountUser(); return <AddressBook initial={me.addresses} />; }
