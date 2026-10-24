export default function TopBar({ title, subtitle }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] px-8 py-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)] font-mono text-sm text-[var(--color-text-muted)]">
        TK
      </div>
    </header>
  );
}
