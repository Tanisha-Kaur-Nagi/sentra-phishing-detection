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

  // demo checkout popup
  const [checkoutPlan, setCheckoutPlan] = useState(null)
  const [card, setCard] = useState('4111 1111 1111 1111')
  const [expiry, setExpiry] = useState('12/30')
  const [cvv, setCvv] = useState('123')
  const [payError, setPayError] = useState('')
  const [paying, setPaying] = useState(false)

  function loadUsage() {
    if (user) {
      api.getUsage(user.id).then(setUsage).catch(() => {})
    }
  }

  useEffect(() => {
    api.getPlans().then(setPlans).catch((e) => setError(e.message))
    loadUsage()
  }, [])

  async function choose(plan) {
    if (!user) {
      setError('Please log in first')
      return
    }
    setError('')
    setMessage('')
    if (plan.pricePerMonth === 0) {
      setBusy(plan.name)
      try {
        const res = await api.subscribe(user.id, 'Free')
        setMessage(res.message)
        loadUsage()
      } catch (e) {
        setError(e.message)
      }
      setBusy('')
    } else {
      setPayError('')
      setCheckoutPlan(plan)
    }
  }

  async function pay() {
    setPaying(true)
    setPayError('')
    try {
      const res = await fetch('http://localhost:8080/api/payments/mock-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planName: checkoutPlan.name,
          cardNumber: card,
          expiry: expiry,
          cvv: cvv,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPayError(data.error || 'Payment failed')
      } else {
        setCheckoutPlan(null)
        setMessage(data.message)
        loadUsage()
      }
    } catch (e) {
      setPayError('Could not reach the server')
    }
    setPaying(false)
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
                onClick={() => choose(plan)}
                disabled={current || busy === plan.name}
                className="w-full rounded-lg px-3 py-2.5 text-sm font-medium bg-[var(--bg-surface-2)] hover:opacity-80 disabled:opacity-50"
              >
                {current ? 'Current plan' : busy === plan.name ? 'Please wait...' : plan.pricePerMonth === 0 ? 'Switch to Free' : 'Pay and choose ' + plan.name}
              </button>
            </div>
          )
        })}
      </div>

      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] p-6">
            <div className="font-display text-lg font-semibold">Demo checkout</div>
            <div className="text-xs text-[var(--text-muted)] mb-4">
              Simulated payment for the {checkoutPlan.name} plan. No real money is used.
            </div>
            <div className="text-2xl font-semibold mb-4">Rs {checkoutPlan.pricePerMonth.toLocaleString('en-IN')}</div>

            <label className="text-xs text-[var(--text-muted)]">Card number (test card)</label>
            <input
              value={card}
              onChange={(e) => setCard(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-line)] text-sm font-mono outline-none"
            />
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="text-xs text-[var(--text-muted)]">Expiry (MM/YY)</label>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-line)] text-sm font-mono outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[var(--text-muted)]">CVV</label>
                <input
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-line)] text-sm font-mono outline-none"
                />
              </div>
            </div>

            {payError && <div className="text-xs mb-3" style={{ color: 'var(--signal-danger)' }}>{payError}</div>}

            <div className="flex gap-3">
              <button
                onClick={() => setCheckoutPlan(null)}
                disabled={paying}
                className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium bg-[var(--bg-surface-2)] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={pay}
                disabled={paying}
                className="flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold bg-[var(--signal-safe)] text-[#06110D] hover:brightness-110 disabled:opacity-60"
              >
                {paying ? 'Processing...' : 'Pay Rs ' + checkoutPlan.pricePerMonth.toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}