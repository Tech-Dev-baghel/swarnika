const STEPS = ["new", "confirmed", "shipped", "delivered"];
const LABEL: Record<string, string> = { new: "Placed", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
const PILL: Record<string, string> = { new: "bg-gold-100 text-gold-600", confirmed: "bg-sky-100 text-sky-800", shipped: "bg-indigo-100 text-indigo-800", delivered: "bg-emerald-100 text-emerald-800", cancelled: "bg-stone-200 text-stone-600" };

export const StatusPill = ({ s }: { s: string }) => <span className={`rounded-full px-2.5 py-0.5 text-xs ${PILL[s] ?? ""}`}>{LABEL[s] ?? s}</span>;

export function StatusSteps({ s }: { s: string }) {
  if (s === "cancelled") return <p className="rounded-xl bg-wine-50 p-3 text-sm text-wine-800">This order was cancelled.</p>;
  const at = STEPS.indexOf(s);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((x, i) => (
        <li key={x} className="text-center">
          <div className={`h-1.5 rounded-full ${i <= at ? "bg-gold-500" : "bg-wine-100"}`} />
          <p className={`mt-2 text-xs ${i <= at ? "font-medium text-wine-800" : "text-ink/40"}`}>{LABEL[x]}</p>
        </li>
      ))}
    </ol>
  );
}
