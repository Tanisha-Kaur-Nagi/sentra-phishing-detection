import { verdictColors } from '../data/mockData'

export default function VerdictRing({ verdict, confidence, size = 180, scanning = false }) {
  const color = verdictColors[verdict] || 'var(--text-muted)'
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (confidence / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {scanning && (
        <div
          className="absolute inset-0 rounded-full animate-sweep"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${color}55 15%, transparent 30%)`,
          }}
        />
      )}

      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-surface-2)"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={scanning ? circumference : offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        {scanning ? (
          <span className="font-mono text-xs tracking-widest text-[var(--text-muted)] animate-pulse">
            SCANNING
          </span>
        ) : (
          <>
            <span className="font-display text-2xl font-semibold" style={{ color }}>
              {verdict}
            </span>
            <span className="font-mono text-xs text-[var(--text-muted)] mt-1">
              {confidence}% confidence
            </span>
          </>
        )}
      </div>
    </div>
  )
}