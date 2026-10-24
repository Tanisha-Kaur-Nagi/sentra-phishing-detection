import { users } from "../data/mockData";

export default function AdminUsers() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-text-dim)]">
            <th className="px-6 py-4 font-medium">Name</th>
            <th className="px-6 py-4 font-medium">Email</th>
            <th className="px-6 py-4 font-medium">Role</th>
            <th className="px-6 py-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
              <td className="px-6 py-4 text-[var(--color-text)]">{u.name}</td>
              <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)]">{u.email}</td>
              <td className="px-6 py-4 text-[var(--color-text-muted)]">{u.role}</td>
              <td className="px-6 py-4">
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-mono"
                  style={{
                    color: u.status === "Active" ? "var(--color-safe)" : "var(--color-text-dim)",
                    background: u.status === "Active" ? "var(--color-safe-dim)" : "var(--color-surface-2)",
                  }}
                >
                  {u.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}