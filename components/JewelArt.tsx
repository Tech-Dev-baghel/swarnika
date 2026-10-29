import { useId } from "react";
import type { Metal, Stone } from "@/lib/types";

type Kind = "ring" | "earring" | "necklace" | "pendant" | "bangle" | "bracelet" | "chain" | "mangalsutra" | "nosepin" | "coin";
const KINDS: Kind[] = ["ring", "earring", "necklace", "pendant", "bangle", "bracelet", "chain", "mangalsutra", "nosepin", "coin"];

const METAL: Record<Metal, [string, string, string]> = {
  yellow: ["#fff1c1", "#d9a441", "#8a5a12"],
  rose: ["#ffe1d6", "#d8957f", "#8c4a3b"],
  white: ["#ffffff", "#cfd4dc", "#7d8592"],
  platinum: ["#ffffff", "#c3c8cf", "#6d7480"],
};
const STONE: Record<Exclude<Stone, "none">, [string, string]> = {
  diamond: ["#ffffff", "#a9c6e8"],
  ruby: ["#ff8a9a", "#9b0f2a"],
  emerald: ["#9cf2c4", "#0b6b45"],
  pearl: ["#ffffff", "#e7dccb"],
};

export default function JewelArt({
  kind: rawKind, metal, stone, className = "",
}: { kind: string; metal: Metal; stone: Stone; className?: string }) {
  const kind: Kind = (KINDS as string[]).includes(rawKind) ? (rawKind as Kind) : "pendant";
  const uid = useId().replace(/:/g, "");
  const m = `m${uid}`, s = `s${uid}`, sh = `sh${uid}`;
  const [l, mid, d] = METAL[metal];
  const st = stone === "none" ? null : STONE[stone];
  const gem = (cx: number, cy: number, r: number) =>
    st ? (
      <g>
        <circle cx={cx} cy={cy} r={r + 2.5} fill={`url(#${m})`} />
        <circle cx={cx} cy={cy} r={r} fill={`url(#${s})`} />
        <path d={`M${cx - r * 0.5} ${cy - r * 0.35} L${cx} ${cy - r * 0.8} L${cx + r * 0.5} ${cy - r * 0.35}`} stroke="#fff" strokeOpacity=".7" strokeWidth="1" fill="none" />
      </g>
    ) : (
      <circle cx={cx} cy={cy} r={r * 0.8} fill={`url(#${m})`} stroke={d} strokeWidth="1" />
    );

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`${metal} ${kind}`}>
      <defs>
        <linearGradient id={m} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={l} />
          <stop offset=".45" stopColor={mid} />
          <stop offset="1" stopColor={d} />
        </linearGradient>
        {st && (
          <radialGradient id={s} cx=".35" cy=".3" r=".8">
            <stop offset="0" stopColor={st[0]} />
            <stop offset="1" stopColor={st[1]} />
          </radialGradient>
        )}
        <radialGradient id={sh} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".18" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="176" rx="58" ry="8" fill={`url(#${sh})`} />
      {kind === "ring" && (
        <g>
          <ellipse cx="100" cy="122" rx="46" ry="40" fill="none" stroke={`url(#${m})`} strokeWidth="11" />
          <ellipse cx="100" cy="122" rx="46" ry="40" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
          <path d="M84 84 L100 70 L116 84 Z" fill={`url(#${m})`} />
          {gem(100, 68, 15)}
        </g>
      )}
      {kind === "earring" && [62, 138].map((x) => (
        <g key={x}>
          <path d={`M${x} 32 q10 0 10 10`} stroke={`url(#${m})`} strokeWidth="3" fill="none" />
          {gem(x, 52, 8)}
          <path d={`M${x - 22} 118 Q${x} 64 ${x + 22} 118 Z`} fill={`url(#${m})`} stroke={d} strokeWidth="1" />
          {[...Array(7)].map((_, i) => (
            <circle key={i} cx={x - 20 + i * 6.66} cy={124} r="3" fill={st ? `url(#${s})` : `url(#${m})`} />
          ))}
          <path d={`M${x - 12} 98 h24`} stroke={d} strokeOpacity=".5" />
        </g>
      ))}
      {kind === "necklace" && (
        <g>
          <path d="M30 40 Q100 170 170 40" fill="none" stroke={`url(#${m})`} strokeWidth="5" />
          {[...Array(13)].map((_, i) => {
            const t = (i + 1) / 14;
            const x = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 100 + t * t * 170;
            const y = (1 - t) * (1 - t) * 40 + 2 * (1 - t) * t * 170 + t * t * 40;
            return <g key={i}>{i % 2 ? gem(x, y + 4, 4.5) : <circle cx={x} cy={y + 4} r="5" fill={`url(#${m})`} />}</g>;
          })}
          <path d="M84 112 L100 150 L116 112 Z" fill={`url(#${m})`} stroke={d} strokeWidth="1" />
          {gem(100, 122, 10)}
        </g>
      )}
      {kind === "pendant" && (
        <g>
          <path d="M60 20 L100 92 L140 20" fill="none" stroke={`url(#${m})`} strokeWidth="2.5" />
          <circle cx="100" cy="96" r="6" fill="none" stroke={`url(#${m})`} strokeWidth="3" />
          <path d="M100 104 C70 130 78 162 100 162 C122 162 130 130 100 104 Z" fill={`url(#${m})`} stroke={d} />
          {gem(100, 140, 12)}
        </g>
      )}
      {kind === "bangle" && (
        <g>
          <ellipse cx="100" cy="112" rx="64" ry="50" fill="none" stroke={`url(#${m})`} strokeWidth="18" />
          <ellipse cx="100" cy="112" rx="64" ry="50" fill="none" stroke={d} strokeOpacity=".35" strokeWidth="1" strokeDasharray="2 6" />
          {[0, 60, 120, 180, 240, 300].map((a) => {
            const r = (a * Math.PI) / 180;
            return <g key={a}>{gem(100 + 64 * Math.cos(r), 112 + 50 * Math.sin(r), 4)}</g>;
          })}
        </g>
      )}
      {kind === "bracelet" && (
        <g>
          {[...Array(18)].map((_, i) => {
            const r = (i / 18) * Math.PI * 2;
            const x = 100 + 62 * Math.cos(r), y = 112 + 44 * Math.sin(r);
            return <g key={i}>{st ? gem(x, y, 5) : <ellipse cx={x} cy={y} rx="8" ry="5" fill="none" stroke={`url(#${m})`} strokeWidth="3" transform={`rotate(${(i / 18) * 360 + 90} ${x} ${y})`} />}</g>;
          })}
        </g>
      )}
      {kind === "chain" && (
        <g>
          {[...Array(26)].map((_, i) => {
            const t = i / 25;
            const x = 26 + t * 148;
            const y = 60 + Math.sin(t * Math.PI) * 90;
            return <ellipse key={i} cx={x} cy={y} rx="7" ry="4.5" fill="none" stroke={`url(#${m})`} strokeWidth="3" transform={`rotate(${i % 2 ? 60 : -30} ${x} ${y})`} />;
          })}
        </g>
      )}
      {kind === "mangalsutra" && (
        <g>
          {[...Array(20)].map((_, i) => {
            const t = i / 19;
            const x = 34 + t * 132;
            const y = 34 + (1 - Math.abs(t * 2 - 1)) * 92;
            return <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 4.5 : 3.5} fill={i % 4 === 0 ? `url(#${m})` : "#1c1416"} />;
          })}
          <circle cx="86" cy="140" r="14" fill={`url(#${m})`} stroke={d} />
          <circle cx="114" cy="140" r="14" fill={`url(#${m})`} stroke={d} />
          {st && <>{gem(86, 140, 6)}{gem(114, 140, 6)}</>}
        </g>
      )}
      {kind === "nosepin" && (
        <g>
          {[0, 72, 144, 216, 288].map((a) => {
            const r = (a * Math.PI) / 180;
            return <circle key={a} cx={100 + 22 * Math.cos(r)} cy={100 + 22 * Math.sin(r)} r="16" fill={`url(#${m})`} stroke={d} strokeWidth="1" />;
          })}
          {gem(100, 100, 14)}
          <path d="M100 124 v36" stroke={`url(#${m})`} strokeWidth="3" />
        </g>
      )}
      {kind === "coin" && (
        <g>
          <circle cx="100" cy="104" r="62" fill={`url(#${m})`} stroke={d} strokeWidth="2" />
          <circle cx="100" cy="104" r="52" fill="none" stroke={d} strokeOpacity=".5" strokeDasharray="3 3" />
          <path d="M100 66 C88 84 88 96 100 108 C112 96 112 84 100 66 Z M78 120 h44" stroke={d} strokeWidth="3" fill="none" />
          <text x="100" y="146" textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fill={d}>999.9</text>
        </g>
      )}
    </svg>
  );
}
