import { inr } from "@/lib/pricing";

/** Revenue per day as columns, with a value on hover. Server-rendered SVG. */
export function DailyChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const W = 760, H = 220, pad = { l: 56, r: 8, t: 12, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const nice = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / nice) * nice;
  const bw = (W - pad.l - pad.r) / Math.max(1, data.length);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / top);
  const step = Math.ceil(data.length / 8);
  const short = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${Math.round(n / 1e3)}K` : `₹${n}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Revenue per day">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={y(top * f)} y2={y(top * f)} stroke="#e7e5e4" />
          <text x={pad.l - 6} y={y(top * f) + 4} textAnchor="end" fontSize="10" fill="#78716c">{short(top * f)}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <g key={d.day}>
          <rect x={pad.l + i * bw + bw * 0.15} y={y(d.revenue)} width={Math.max(1, bw * 0.7)} height={Math.max(0, H - pad.b - y(d.revenue))} rx="2" fill="#b45309">
            <title>{`${d.day}: ${inr(d.revenue)} · ${d.orders} order${d.orders === 1 ? "" : "s"}`}</title>
          </rect>
          {i % step === 0 && <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#78716c">{d.day.slice(5)}</text>}
        </g>
      ))}
    </svg>
  );
}

/** Horizontal bars for a ranked list. */
export function Bars({ rows }: { rows: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-6 text-center text-sm text-stone-500">No sales in this period.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between gap-2"><span className="truncate">{r.label}</span><span className="shrink-0 font-medium">{inr(r.value)}{r.sub && <span className="ml-2 text-xs font-normal text-stone-500">{r.sub}</span>}</span></div>
          <div className="mt-1 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-amber-600" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
