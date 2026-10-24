import { verdicts } from "../data/mockData";

export default function StatusBadge({ verdict, size = "md" }) {
  const v = verdicts[verdict] ?? verdicts.suspicious;
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium ${pad}`}
      style={{ background: v.dim, color: v.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.color }} />
      {v.label}
    </span>
  );
}