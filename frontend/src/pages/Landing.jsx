import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Zap, Eye, Users2 } from "lucide-react";
import VerdictGauge from "../components/VerdictGauge";
import StatusBadge from "../components/StatusBadge";

const demoResults = {
  "https://paypal-secure-login.verify-account.info": { verdict: "malicious", confidence: 97 },
  "https://github.com/anthropics/claude": { verdict: "safe", confidence: 99 },
  "https://bit.ly/3xQmT9k": { verdict: "suspicious", confidence: 61 },
};

export default function Landing() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function runDemoScan(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const known = demoResults[input.trim()];
      setResult(
        known ?? {
          verdict: Math.random() > 0.6 ? "malicious" : Math.random() > 0.5 ? "suspicious" : "safe",
          confidence: Math.floor(55 + Math.random() * 44),
        }
      );
      setLoading(false);
    }, 900);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="flex items-center justify-between px-8 py-5 md:px-16">
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-[var(--color-brand)]" />
          <span className="font-display text-lg font-semibold tracking-tight">Sentinel</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-dim)]"
          >
            Create account
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-8 pb-24 pt-12 md:grid-cols-2 md:px-16">
        <div>
          <span className="inline-block rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-text-muted)]">
            TYBCA SEM V · final year project
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--color-text)]">
            Know before you click.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
            Sentinel analyzes URLs and files with a trained machine learning model — catching phishing
            pages and malware that static blacklists have never seen before.
          </p>

          <form onSubmit={runDemoScan} className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 font-mono">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-dim)]">
              <span className="text-[var(--color-brand)]">$</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="scan --url https://example.com"
                className="w-full bg-transparent text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-dim)]"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-[var(--color-brand)] px-3 py-1.5 text-xs font-sans font-medium text-white hover:bg-[var(--color-brand-dim)]"
              >
                {loading ? "…" : "Run"}
              </button>
            </div>
          </form>
          <p className="mt-2 text-xs text-[var(--color-text-dim)]">
            Try: <button onClick={() => setInput("https://bit.ly/3xQmT9k")} className="underline decoration-dotted hover:text-[var(--color-text-muted)]">https://bit.ly/3xQmT9k</button>
          </p>
        </div>

        <div className="flex justify-center">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            {result ? (
              <div className="flex flex-col items-center gap-4">
                <VerdictGauge verdict={result.verdict} confidence={result.confidence} />
                <StatusBadge verdict={result.verdict} />
              </div>
            ) : (
              <div className="flex h-[168px] w-[168px] flex-col items-center justify-center gap-3 text-center">
                <span className="font-mono text-xs text-[var(--color-text-dim)]">
                  {loading ? "analyzing…" : "awaiting input"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-8 py-16 md:grid-cols-3 md:px-16">
          <Feature icon={Zap} title="Catches the unseen" body="Trained on structural URL and file features, so it flags brand-new threats a blacklist has never logged." />
          <Feature icon={Eye} title="Explains its verdict" body="Every scan returns a confidence score, not a bare yes/no — so you understand why something was flagged." />
          <Feature icon={Users2} title="Human-reviewed" body="Low-confidence results go to an analyst queue, so uncertain calls get a second, human check." />
        </div>
      </section>

      <footer className="px-8 py-8 text-center text-xs text-[var(--color-text-dim)] md:px-16">
        Built for the AI-Powered Threat Detection Platform synopsis · UI prototype
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, body }) {
  return (
    <div>
      <Icon size={20} className="text-[var(--color-brand)]" />
      <h3 className="mt-3 font-display text-base font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{body}</p>
    </div>
  );
}