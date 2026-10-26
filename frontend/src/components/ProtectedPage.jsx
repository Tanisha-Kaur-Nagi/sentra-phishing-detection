import { Navigate } from "react-router-dom";
import AppLayout from "./AppLayout";
import { getCurrentUser } from "../lib/api";

const homeByRole = {
  user: "/app/scan",
  analyst: "/app/analyst",
  admin: "/app/admin",
};

// The guard at each door: checks login and role, then shows the page
export default function ProtectedPage({ allow, title, subtitle, children }) {
  const user = getCurrentUser();

  // Not logged in: go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || "").toLowerCase();

  // Wrong role: go back to your own page
  if (!allow.includes(role)) {
    return <Navigate to={homeByRole[role] || "/login"} replace />;
  }

  return (
    <AppLayout role={role} title={title} subtitle={subtitle}>
      {children}
    </AppLayout>
  );
}