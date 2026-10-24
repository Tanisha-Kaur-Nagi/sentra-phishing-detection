const BASE_URL = 'http://localhost:8080/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Something went wrong' }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (name, email, password, role) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }),

  submitScan: (type, target, userId) =>
    request('/scans', { method: 'POST', body: JSON.stringify({ type, target, userId }) }),

  getUserScans: (userId) => request(`/scans/user/${userId}`),

  getQueue: (analystId) =>
    request(`/analyst/queue${analystId ? `?analystId=${analystId}` : ''}`),

  reviewScan: (scanId, analystId, decision, comment, timeSpentSeconds) =>
    request(`/analyst/review/${scanId}`, {
      method: 'PUT',
      body: JSON.stringify({ analystId, decision, comment, timeSpentSeconds }),
    }),

  clockIn: (userId) => request(`/analyst/${userId}/clock-in`, { method: 'POST' }),
  clockOut: (userId) => request(`/analyst/${userId}/clock-out`, { method: 'POST' }),
  getLeaderboard: () => request('/analyst/leaderboard'),

  getAdminStats: () => request('/admin/stats'),
  getRevenue: () => request('/admin/revenue'),

  // Pricing and plans
  getPlans: () => request('/plans'),
  getUsage: (userId) => request(`/scans/usage/${userId}`),
  subscribe: (userId, planName) =>
    request('/plans/subscribe', { method: 'POST', body: JSON.stringify({ userId, planName }) }),
};

export function getCurrentUser() {
  const raw = localStorage.getItem('sentra_user');
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user) {
  localStorage.setItem('sentra_user', JSON.stringify(user));
}