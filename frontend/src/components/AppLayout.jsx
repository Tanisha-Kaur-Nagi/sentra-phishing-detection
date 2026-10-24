import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppLayout({ role, onRoleChange, title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar role={role} onRoleChange={onRoleChange} />
      <div className="flex-1">
        <TopBar title={title} subtitle={subtitle} />
        <main className="px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
