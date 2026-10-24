import { verdictColors } from '../data/mockData'

export function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
      <p className="font-display text-3xl font-semibold mt-2" style={{ color: accent || 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  )
}

export function VerdictBadge({ verdict }) {
  const color = verdictColors[verdict] || 'var(--text-muted)'
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono" style={{ background: `${color}1F`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />{verdict}
    </span>
  )
}

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 mb-8">
      <div>
        {eyebrow && <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--signal-safe)] mb-2">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xl">{description}</p>}
      </div>
      {children}
    </div>
  )
}