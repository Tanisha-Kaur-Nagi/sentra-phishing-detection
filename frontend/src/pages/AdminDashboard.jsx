import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { trendData, businessMetrics as b } from "../data/mockData";
import { api } from "../lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [analysts, setAnalysts] = useState([]);
  const [lbError, setLbError] = useState("");

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(() => {});
    api.getRevenue().then(setRevenue).catch(() => {});
    api
      .getLeaderboard()
      .then((d) => setAnalysts(Array.isArray(d) ? d : d.leaderboard || []))
      .catch((e) => setLbError(e.message));
  }, []);

  const mrr = revenue ? revenue.mrr : 0;
  const costs = b.analystCost + b.hostingCost;
  const netMargin = mrr - costs;
  const plans = revenue ? revenue.plans : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total scans" value={stats ? stats.totalScans.toLocaleString() : "—"} />
        <Stat label="Threats detected" value={stats ? stats.threatsBlocked.toLocaleString() : "—"} accent="var(--color-malicious)" />
        <Stat label="Total users" value={stats ? stats.totalUsers : "—"} />
        <Stat label="Avg. confidence" value={stats ? `${stats.avgConfidence}%` : "—"} accent="var(--color-brand)" />
      </div>

      {/* Revenue overview (real data from subscriptions) */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-1 font-display text-sm font-semibold text-[var(--color-text)]">Revenue overview</h2>
        <p className="mb-5 text-xs text-[var(--color-text-muted)]">Subscriptions by plan, monthly</p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="MRR" value={`₹${mrr.toLocaleString("en-IN")}`} accent="var(--color-safe)" />
          <Stat label="Paid subscribers" value={revenue ? revenue.paidSubscribers : "—"} />
          <Stat label="Monthly costs" value={`₹${costs.toLocaleString("en-IN")}`} />
          <Stat
            label="Net margin"
            value={`₹${netMargin.toLocaleString("en-IN")}`}
            accent={netMargin >= 0 ? "var(--color-safe)" : "var(--color-malicious)"}
          />
        </div>

        <div className="mt-5 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm">
          {plans.map((p) => (
            <Row
              key={p.name}
              label={`${p.name}: ${p.subscribers} ${p.subscribers === 1 ? "user" : "users"} × ₹${p.price.toLocaleString("en-IN")}`}
              value={`+₹${p.revenue.toLocaleString("en-IN")}`}
            />
          ))}
          <Row label="Analyst review costs (part-time, per-review)" value={`−₹${b.analystCost.toLocaleString("en-IN")}`} negative />
          <Row label="Hosting & infrastructure" value={`−₹${b.hostingCost.toLocaleString("en-IN")}`} negative />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-1 font-display text-sm font-semibold text-[var(--color-text)]">Detection trend — last 7 days</h2>
        <p className="mb-5 text-xs text-[var(--color-text-muted)]">Scan volume by verdict (sample data)</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="safeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-safe)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-safe)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="susFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-suspicious)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-suspicious)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="malFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-malicious)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-malicious)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" stroke="var(--color-text-dim)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-text-dim)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="safe" stroke="var(--color-safe)" fill="url(#safeFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="suspicious" stroke="var(--color-suspicious)" fill="url(#susFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="malicious" stroke="var(--color-malicious)" fill="url(#malFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Analyst performance table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-1 font-display text-sm font-semibold text-[var(--color-text)]">Analyst performance</h2>
        <p className="mb-5 text-xs text-[var(--color-text-muted)]">
          Agreement rate = how often the analyst voted with the final majority
        </p>
        {lbError && <p className="text-sm text-[var(--color-malicious)]">{lbError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[var(--color-text-muted)]">
              <tr>
                <th className="pb-3">Analyst</th>
                <th className="pb-3">Reviews</th>
                <th className="pb-3">Agreement rate</th>
                <th className="pb-3">Avg. time</th>
                <th className="pb-3">Hours</th>
                <th className="pb-3">Earnings</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-text)]">
              {analysts.map((a, i) => (
                <tr key={i} className="border-t border-[var(--color-border)]">
                  <td className="py-3">{a.name || a.email}</td>
                  <td>{a.totalReviews ?? 0}</td>
                  <td>{a.agreementRate != null ? `${a.agreementRate}%` : "—"}</td>
                  <td>{a.avgReviewSeconds != null ? `${a.avgReviewSeconds}s` : "—"}</td>
                  <td>{a.hoursWorked ?? 0}</td>
                  <td>₹{a.earnings ?? 0}</td>
                </tr>
              ))}
              {analysts.length === 0 && !lbError && (
                <tr>
                  <td colSpan={6} className="py-4 text-[var(--color-text-muted)]">No analyst data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "var(--color-text)" }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, negative }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-mono" style={{ color: negative ? "var(--color-malicious)" : "var(--color-safe)" }}>
        {value}
      </span>
    </div>
  );
}