import { useState, useEffect } from "react";
import { Check, X, IndianRupee, Clock } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { api, getCurrentUser } from "../lib/api";

// Verdicts come back from the backend in UPPERCASE (SAFE / SUSPICIOUS / MALICIOUS),
// but StatusBadge expects lowercase keys — this converts between the two.
function toLowerVerdict(v) {
  return (v || "suspicious").toLowerCase();
}

export default function AnalystDashboard() {
  const user = getCurrentUser();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);

  async function loadQueue() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getQueue(user?.id);
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function handleReview(scanId, decision) {
    setSubmittingId(scanId);
    setError("");
    try {
      await api.reviewScan(scanId, user?.id, decision);
      // Remove it from this analyst's local queue immediately — whether or not
      // it fully resolved, this analyst has already cast their vote.
      setQueue((q) => q.filter((item) => item.id !== scanId));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingId(null);
    }
  }

  async function toggleClock() {
    try {
      if (clockedIn) {
        await api.clockOut(user?.id);
        setClockedIn(false);
      } else {
        await api.clockIn(user?.id);
        setClockedIn(true);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          {loading ? "Loading queue…" : `${queue.length} scan${queue.length !== 1 ? "s" : ""} waiting for your review.`}
        </p>
        <button
          onClick={toggleClock}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
            clockedIn
              ? "border-[var(--color-malicious)] text-[var(--color-malicious)] hover:bg-[var(--color-malicious-dim)]"
              : "border-[var(--color-safe)] text-[var(--color-safe)] hover:bg-[var(--color-safe-dim)]"
          }`}
        >
          <Clock size={14} /> {clockedIn ? "Clock out" : "Clock in"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-malicious)] bg-[var(--color-malicious-dim)] px-4 py-3 text-sm text-[var(--color-malicious)]">
          {error}
        </div>
      )}

      {!loading && queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center text-sm text-[var(--color-text-muted)]">
          Queue is clear. Nothing needs review right now.
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--color-text-dim)]">SCN-{item.id}</span>
                  <StatusBadge verdict={toLowerVerdict(item.verdict)} size="sm" />
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">
                    {item.confidence ? `${Math.round(item.confidence)}% confidence` : ""}
                  </span>
                  <span className="flex items-center gap-0.5 rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">
                    {item.voteCount ?? 0}/3 votes
                  </span>
                </div>
                <p className="mt-2 truncate font-mono text-sm text-[var(--color-text)]">{item.target}</p>
                <p className="mt-1 text-xs text-[var(--color-text-dim)]">{item.type}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  disabled={submittingId === item.id}
                  onClick={() => handleReview(item.id, "MALICIOUS")}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--color-malicious)] px-3 py-2 text-xs font-medium text-[var(--color-malicious)] hover:bg-[var(--color-malicious-dim)] disabled:opacity-50"
                >
                  <X size={14} /> Confirm threat
                </button>
                <button
                  disabled={submittingId === item.id}
                  onClick={() => handleReview(item.id, "SAFE")}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--color-safe)] px-3 py-2 text-xs font-medium text-[var(--color-safe)] hover:bg-[var(--color-safe-dim)] disabled:opacity-50"
                >
                  <Check size={14} /> Mark safe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}