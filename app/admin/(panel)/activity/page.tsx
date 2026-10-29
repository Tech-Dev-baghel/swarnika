import { Title } from "@/components/admin/More";
import { adminPage } from "@/lib/admin-guard";
import { listAudit } from "@/lib/db";

export default async function Page() {
  await adminPage("activity");
  const rows = await listAudit();
  return (
    <div>
      <Title title="Activity Log" sub="Who signed in and what they changed (last 500 entries)." />
      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">What</th><th className="hidden px-4 py-3 md:table-cell">Details</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-stone-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-2 text-stone-500">{new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-4 py-2">{r.actor}</td>
                <td className={`px-4 py-2 ${r.action.startsWith("Failed") ? "text-red-600" : ""}`}>{r.action}</td>
                <td className="hidden px-4 py-2 text-stone-500 md:table-cell">{r.detail}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-stone-500">Nothing yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
