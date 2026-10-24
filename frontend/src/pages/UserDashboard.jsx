import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, UploadCloud, Search } from 'lucide-react'

import VerdictRing from '../components/VerdictRing'
import { PageHeader, StatCard, VerdictBadge } from '../components/UiBits'
import { api, getCurrentUser } from '../lib/api'

// Backend returns verdicts as "SAFE" / "SUSPICIOUS" / "MALICIOUS" (matches
// the Java enum). Our components expect "Safe" / "Suspicious" / "Malicious"
// (matches verdictColors in mockData.js) — this converts between the two.
function capitalize(str) {
  return str ? str.charAt(0) + str.slice(1).toLowerCase() : str
}

// Backend sends reasons as one text joined with " | " — turn it into a list
function splitReasons(text) {
  if (!text) return []
  return text.split('|').map(r => r.trim()).filter(Boolean)
}

export default function UserDashboard() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const [mode, setMode] = useState('url')
  const [input, setInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState('')

  const loadHistory = async () => {
    try {
      const scans = await api.getUserScans(user.id)
      setHistory(scans)
    } catch (err) {
      setError(err.message)
    }
  }

  const loadUsage = async () => {
    try {
      const u = await api.getUsage(user.id)
      setUsage(u)
    } catch (err) {
      // usage line is optional, ignore errors
    }
  }

  useEffect(() => {
    if (user) {
      loadHistory()
      loadUsage()
    }
  }, [])

  const handleScan = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setResult(null)
    setError('')
    setScanning(true)
    try {
      const scan = await api.submitScan(mode.toUpperCase(), input, user.id)
      setResult({
        verdict: capitalize(scan.verdict),
        confidence: Math.round(scan.confidence),
        reasons: splitReasons(scan.reasons),
        underReview: scan.verdict === 'SUSPICIOUS',
      })
      await loadHistory()
      await loadUsage()
    } catch (err) {
      setError(err.message)
      await loadUsage()
    } finally {
      setScanning(false)
    }
  }

  const userStats = {
    totalScans: history.length,
    malicious: history.filter(s => s.verdict === 'MALICIOUS').length,
    suspicious: history.filter(s => s.verdict === 'SUSPICIOUS').length,
    safe: history.filter(s => s.verdict === 'SAFE').length,
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[var(--text-muted)]">
        You're not logged in. Please sign in first.
      </div>
    )
  }

  const limitReached = error.toLowerCase().includes('daily limit')

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="End-user dashboard"
        title="Submit a link or file for analysis"
        description="The model reads the character patterns of a URL, such as keywords, hyphens and structure, and compares them with learned phishing patterns. Risky links are sent to human analysts."
      />

      {usage && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-line)] text-sm flex items-center justify-between">
          <span>
            Plan: <b>{usage.plan}</b> &nbsp;|&nbsp; Scans used today: <b>{usage.usedToday}</b>
            {usage.limit === null ? ' (unlimited)' : ' of ' + usage.limit}
          </span>
          <button
            onClick={() => navigate('/app/pricing')}
            className="text-xs font-medium text-[var(--signal-safe)] hover:underline"
          >
            View plans
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-[var(--signal-danger)]/10 border border-[var(--signal-danger)]/30 text-sm text-[var(--signal-danger)] flex items-center justify-between gap-4">
          <span>{error}</span>
          {limitReached && (
            <button
              onClick={() => navigate('/app/pricing')}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--signal-safe)] text-[#06110D] text-xs font-semibold hover:brightness-110"
            >
              Upgrade plan
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
        <div className="lg:col-span-3 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] p-6">
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode('url')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'url' ? 'bg-[var(--signal-safe)] text-[#06110D]' : 'bg-[var(--bg-surface-2)] text-[var(--text-muted)]'
              }`}
            >
              <Link2 size={14} /> URL
            </button>
            <button
              onClick={() => setMode('file')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'file' ? 'bg-[var(--signal-safe)] text-[#06110D]' : 'bg-[var(--bg-surface-2)] text-[var(--text-muted)]'
              }`}
            >
              <UploadCloud size={14} /> File
            </button>
          </div>

          <form onSubmit={handleScan}>
            {mode === 'url' ? (
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste a URL, e.g. https://example.com/login"
                  className="w-full pl-10 pr-3.5 py-3 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-line)] text-sm font-mono outline-none focus:border-[var(--signal-safe)] transition-colors"
                />
              </div>
            ) : (
              <label className="mb-4 flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--border-line)] rounded-lg py-8 cursor-pointer hover:border-[var(--signal-safe)] transition-colors">
                <UploadCloud size={22} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-muted)]">
                  {input ? input : 'Click to choose a file, or drag it here'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setInput(e.target.files?.[0]?.name || '')}
                />
              </label>
            )}

            <button
              type="submit"
              disabled={scanning}
              className="w-full py-2.5 rounded-lg bg-[var(--signal-safe)] text-[#06110D] text-sm font-semibold disabled:opacity-60 hover:brightness-110 transition-all"
            >
              {scanning ? 'Analyzing…' : 'Run scan'}
            </button>
          </form>

          <div className="grid grid-cols-4 gap-3 mt-6">
            <StatCard label="Total scans" value={userStats.totalScans} />
            <StatCard label="Malicious" value={userStats.malicious} accent="var(--signal-danger)" />
            <StatCard label="Suspicious" value={userStats.suspicious} accent="var(--signal-warn)" />
            <StatCard label="Safe" value={userStats.safe} accent="var(--signal-safe)" />
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] p-6 flex flex-col items-center justify-center">
          {result || scanning ? (
            <VerdictRing verdict={result?.verdict} confidence={result?.confidence} scanning={scanning} />
          ) : (
            <div className="text-center px-4">
              <VerdictRing verdict="Safe" confidence={0} scanning={false} />
              <p className="text-xs text-[var(--text-muted)] mt-4">
                Your verdict will appear here after a scan.
              </p>
            </div>
          )}

          {result && !scanning && (
            <div className="w-full mt-6 text-left">
              {result.underReview && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-[var(--signal-warn)]/10 border border-[var(--signal-warn)]/30 text-xs text-[var(--signal-warn)]">
                  Sent to human analysts for review. The final verdict will appear in your scan history.
                </div>
              )}
              <h3 className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-2">
                Why this verdict
              </h3>
              <ul className="space-y-1.5">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[var(--text-muted)]">
                    <span className="text-[var(--signal-safe)]">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <h2 className="font-display text-lg font-semibold mb-4">Recent scans</h2>
      <div className="rounded-xl border border-[var(--border-line)] bg-[var(--bg-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-line)]">
              <th className="px-5 py-3 font-medium">Target</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Verdict</th>
              <th className="px-5 py-3 font-medium">Confidence</th>
              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[var(--text-muted)] text-sm">
                  No scans yet — submit a link or file above to get started.
                </td>
              </tr>
            ) : (
              history.map(s => (
                <tr key={s.id} className="border-b border-[var(--border-line)] last:border-0 hover:bg-[var(--bg-surface-2)]/50">
                  <td className="px-5 py-3 font-mono text-xs truncate max-w-[280px]">{s.target}</td>
                  <td className="px-5 py-3 text-[var(--text-muted)]">{s.type}</td>
                  <td className="px-5 py-3"><VerdictBadge verdict={capitalize(s.finalVerdict || s.verdict)} /></td>
                  <td className="px-5 py-3 font-mono text-xs">{Math.round(s.confidence)}%</td>
                  <td className="px-5 py-3 text-[var(--text-muted)] text-xs">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}