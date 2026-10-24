import { NavLink, useNavigate } from 'react-router-dom'
import { ShieldHalf, LayoutGrid, History, Users, Gauge, LogOut, ListChecks, CreditCard } from 'lucide-react'

const navByRole = {
  user: [
    { to: '/app/scan', label: 'Scan', icon: LayoutGrid },
    { to: '/app/history', label: 'History', icon: History },
    { to: '/app/pricing', label: 'Pricing', icon: CreditCard },
  ],
  analyst: [{ to: '/app/analyst', label: 'Review Queue', icon: ListChecks }],
  admin: [
    { to: '/app/admin', label: 'Overview', icon: Gauge },
    { to: '/app/admin/users', label: 'Users', icon: Users },
  ],
}
const roleLabel = { user: 'End User', analyst: 'Security Analyst', admin: 'Administrator' }

export const verdictColors = {
  Safe: 'var(--signal-safe)',
  Suspicious: 'var(--signal-warn)',
  Malicious: 'var(--signal-danger)',
}

export default function Sidebar({ role }) {
  const navigate = useNavigate()
  const items = navByRole[role] || []

  function signOut() {
    localStorage.removeItem('sentra_user')
    navigate('/')
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--border-line)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-2 px-5 py-6">
        <ShieldHalf size={22} color="var(--signal-safe)" strokeWidth={2.2} />
        <span className="font-display text-lg font-semibold tracking-tight">SENTRA</span>
      </div>
      <div className="px-5 pb-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{roleLabel[role]}</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]/60'
            }`}>
            <Icon size={17} strokeWidth={2} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-[var(--border-line)]">
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--signal-danger)] hover:bg-[var(--bg-surface-2)]/60 transition-colors">
          <LogOut size={17} strokeWidth={2} />Sign out
        </button>
      </div>
    </aside>
  )
}