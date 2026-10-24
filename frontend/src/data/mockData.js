// Mock data — stand-in for the real REST API (Java Spring Boot backend)
// described in the synopsis. Replace each of these with a fetch() call
// once the backend endpoints exist.
 export const verdictColors = {
     Safe: '#35D68C',
     Suspicious: '#F5A623',
     Malicious: '#FF5C63',
   }
export const verdicts = {
  safe: { label: "Safe", color: "var(--color-safe)", dim: "var(--color-safe-dim)" },
  suspicious: { label: "Suspicious", color: "var(--color-suspicious)", dim: "var(--color-suspicious-dim)" },
  malicious: { label: "Malicious", color: "var(--color-malicious)", dim: "var(--color-malicious-dim)" },
};

export const recentScans = [
  { id: "SCN-10231", target: "https://paypal-secure-login.verify-account.info", type: "URL", verdict: "malicious", confidence: 97, date: "2026-08-16 18:42" },
  { id: "SCN-10230", target: "invoice_september.pdf.exe", type: "File", verdict: "malicious", confidence: 94, date: "2026-08-16 15:10" },
  { id: "SCN-10229", target: "https://github.com/anthropics/claude", type: "URL", verdict: "safe", confidence: 99, date: "2026-08-16 11:03" },
  { id: "SCN-10228", target: "https://bit.ly/3xQmT9k", type: "URL", verdict: "suspicious", confidence: 61, date: "2026-08-15 22:51" },
  { id: "SCN-10227", target: "quarterly_report.docx", type: "File", verdict: "safe", confidence: 88, date: "2026-08-15 09:17" },
  { id: "SCN-10226", target: "https://mkt-offers-inr.win/claim", type: "URL", verdict: "malicious", confidence: 91, date: "2026-08-14 20:05" },
];

export const analystQueue = [
  { id: "SCN-10228", target: "https://bit.ly/3xQmT9k", type: "URL", verdict: "suspicious", confidence: 61, submittedBy: "r.mehta", date: "2026-08-15 22:51" },
  { id: "SCN-10221", target: "setup_driver_update.msi", type: "File", verdict: "suspicious", confidence: 58, submittedBy: "a.kapoor", date: "2026-08-15 14:22" },
  { id: "SCN-10219", target: "https://accounts-verify-secure.co", type: "URL", verdict: "suspicious", confidence: 66, submittedBy: "s.iyer", date: "2026-08-14 08:40" },
];

export const trendData = [
  { day: "Mon", safe: 120, suspicious: 18, malicious: 9 },
  { day: "Tue", safe: 132, suspicious: 14, malicious: 12 },
  { day: "Wed", safe: 101, suspicious: 22, malicious: 15 },
  { day: "Thu", safe: 145, suspicious: 11, malicious: 7 },
  { day: "Fri", safe: 160, suspicious: 19, malicious: 18 },
  { day: "Sat", safe: 98, suspicious: 9, malicious: 5 },
  { day: "Sun", safe: 87, suspicious: 7, malicious: 4 },
];

export const platformStats = {
  totalScans: 8421,
  threatsDetected: 612,
  activeUsers: 143,
  avgConfidence: 92.4,
};

export const users = [
  { id: 1, name: "Tanisha Kaur", email: "tanisha.kaur@example.com", role: "Admin", status: "Active" },
  { id: 2, name: "R. Mehta", email: "r.mehta@example.com", role: "User", status: "Active" },
  { id: 3, name: "A. Kapoor", email: "a.kapoor@example.com", role: "Analyst", status: "Active" },
  { id: 4, name: "S. Iyer", email: "s.iyer@example.com", role: "User", status: "Suspended" },
];

// ── Business model data ──────────────────────────────────────────────
// Freemium: free tier has a monthly scan cap, Pro removes it.
export const currentUser = {
  name: "Tanisha Kaur",
  plan: "free", // "free" | "pro"
  scansUsedThisMonth: 14,
  scansLimit: 20,
  proPricePerMonth: 149,
};

// Analysts are paid per-review (gig model), not salaried — this is what
// answers "how do you pay the analyst" directly in the UI.
export const analystStats = {
  payPerReview: 8,
  reviewsToday: 12,
  reviewsThisMonth: 214,
};

// The numbers behind "how does this make money" — shown on the Admin
// dashboard so the business model is visible, not just claimed.
export const businessMetrics = {
  mrr: 47500,
  proSubscribers: 150,
  proPricePerMonth: 150,
  apiClients: 5,
  apiRevenuePerClient: 5000,
  analystCost: 35000,
  hostingCost: 5000,
};