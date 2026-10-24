import StatusBadge from "../components/StatusBadge";
import { recentScans } from "../data/mockData";

export default function ScanHistory() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-text-dim)]">
            <th className="px-6 py-4 font-medium">Scan ID</th>
            <th className="px-6 py-4 font-medium">Target</th>
            <th className="px-6 py-4 font-medium">Type</th>
            <th className="px-6 py-4 font-medium">Verdict</th>
            <th className="px-6 py-4 font-medium">Confidence</th>
            <th className="px-6 py-4 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {recentScans.map((s) => (
            <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0">
              <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-dim)]">{s.id}</td>
              <td className="max-w-xs truncate px-6 py-4 font-mono text-[var(--color-text)]">{s.target}</td>
              <td className="px-6 py-4 text-[var(--color-text-muted)]">{s.type}</td>
              <td className="px-6 py-4">
                <StatusBadge verdict={s.verdict} size="sm" />
              </td>
              <td className="px-6 py-4 font-mono text-[var(--color-text-muted)]">{s.confidence}%</td>
              <td className="px-6 py-4 text-[var(--color-text-muted)]">{s.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
