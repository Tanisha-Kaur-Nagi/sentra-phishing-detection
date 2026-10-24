import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldHalf, ArrowRight } from 'lucide-react'
import { api, setCurrentUser } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('tanisha@test.com')
  const [password, setPassword] = useState('test1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await api.login(email, password)
      setCurrentUser(user)
      const roleRoutes = {
  USER: '/app/scan',
  ANALYST: '/app/analyst',
  ADMIN: '/app/admin',
}
window.location.href = roleRoutes[user.role] || '/'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)] px-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <ShieldHalf size={22} color="var(--signal-safe)" />
          <span className="font-display text-lg font-semibold">SENTRA</span>
        </div>

        <h2 className="font-display text-xl font-semibold mb-1">Sign in</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Use an account you registered via Postman/register endpoint.
        </p>

        <label className="block text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3.5 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-line)] text-sm outline-none focus:border-[var(--signal-safe)]"
        />

        <label className="block text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3.5 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-line)] text-sm outline-none focus:border-[var(--signal-safe)]"
        />

        {error && <p className="text-sm text-[var(--signal-danger)] mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--signal-safe)] text-[#06110D] text-sm font-semibold disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Enter dashboard'} <ArrowRight size={16} />
        </button>
      </form>
    </div>
  )
}
