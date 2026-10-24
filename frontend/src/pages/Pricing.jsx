import { useEffect, useState } from 'react'
import { api, getCurrentUser } from '../lib/api'

const audience = {
  Free: 'For checking a few suspicious links',
  Solo: 'For one person who checks links often',
  Team: 'For a small office or group',
  Business: 'For companies that connect their own software',
}

function priceText(plan) {
  if (plan.pricePerMonth === 0) return 'Rs 0'
  const text = 'Rs ' + plan.pricePerMonth.toLocaleString('en-IN')
  return plan.name === 'Business' ? text + '+' : text
}

export default function Pricing() {
  const user = getCurrentUser()
  const [plans, setPlans] = useState([])
  const [usage, setUsage] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  function loadUsage() {
    if (user) {
      api.getUsage(user.id).then(setUsage).catch(() => {})
    }
  }

  useEffect(() => {
    api.getPlans().then(setPlans).catch((e) => setError(e.message))
    loadUsage()
  }, [])

  async function choose(planName) {
    if (!user) {
      setError('Please log in first')
      return
    }
    setError('')
    setMessage('')
    setBusy(planName)
    try {
      const res = await api.subscribe(user.id, planName)
      setMessage(res.message)
      loadUsage()
    } catch (e) {
      setError(e.message)
    }
    setBusy('')
  }

  const order = ['Free', 'Solo', 'Team', 'Business']
  const sorted = [...plans].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))

  return (
    <div className="space-y-6">
      {usage && (
        <div className="rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] p-4 text-sm">
          Your plan: <b>{usage.plan}</b>. Scans used today: <b>{usage.usedToday}</b>
          {usage.limit === null ? ' (unlimited)' : ' of ' + usage.limit}
        </div>
      )}

      {message && <div className="rounded-lg p-3 text-sm" style={{ color: 'var(--signal-safe)' }}>{message}</div>}
      {error && <div className="rounded-lg p-3 text-sm" style={{ color: 'var(--signal-danger)' }}>{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sorted.map((plan) => {
          const current = usage && usage.plan === plan.name
          return (
            <div key={plan.id} className="rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] p-5 flex flex-col">
              <div className="font-display text-lg font-semibold">{plan.name}</div>
              <div className="text-xs text-[var(--text-muted)] mb-4">{audience[plan.name]}</div>
              <div className="text-3xl font-semibold">{priceText(plan)}</div>
              <div className="text-xs text-[var(--text-muted)] mb-4">per month</div>
              <ul className="text-sm space-y-2 flex-1 mb-5">
                <li>{plan.scansPerDay === null ? 'Unlimited scans per day' : plan.scansPerDay + ' scans per day'}</li>
                <li>{plan.seats} {plan.seats === 1 ? 'user' : 'users'}</li>
                <li>{plan.apiAccess ? 'API access' : 'No API access'}</li>
              </ul>
              <button
                onClick={() => choose(plan.name)}
                disabled={current || busy === plan.name}
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium bg-[var(--bg-surface-2)] hover:opacity-80 disabled:opacity-50"
              >
                {current ? 'Current plan' : busy === plan.name ? 'Please wait...' : 'Choose ' + plan.name}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}