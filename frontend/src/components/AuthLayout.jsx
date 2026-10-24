import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <ShieldCheck size={22} className="text-[var(--color-brand)]" />
          <span className="font-display text-lg font-semibold tracking-tight">Sentinel</span>
        </Link>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7">
          <h1 className="font-display text-xl font-semibold text-[var(--color-text)]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">{footer}</p>}
      </div>
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-brand)]"
      />
    </label>
  );
}
