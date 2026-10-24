import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import ScanHistory from "./pages/ScanHistory";
import AnalystDashboard from "./pages/AnalystDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import Pricing from "./pages/Pricing";
import AppLayout from "./components/AppLayout";
import { getCurrentUser } from "./lib/api";

export default function App() {
  const [role, setRole] = useState(getCurrentUser()?.role?.toLowerCase() || "user");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/app/scan"
          element={
            <AppLayout role={role} onRoleChange={setRole} title="Scan" subtitle="Check a URL or file before you open it">
              <UserDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/app/history"
          element={
            <AppLayout role={role} onRoleChange={setRole} title="Scan history" subtitle="Everything you've submitted so far">
              <ScanHistory />
            </AppLayout>
          }
        />
        <Route
          path="/app/pricing"
          element={
            <AppLayout role={role} onRoleChange={setRole} title="Plans and pricing" subtitle="Pick the plan that fits you">
              <Pricing />
            </AppLayout>
          }
        />
        <Route
          path="/app/analyst"
          element={
            <AppLayout role={role} onRoleChange={setRole} title="Review queue" subtitle="Low-confidence scans awaiting a human call">
              <AnalystDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/app/admin"
          element={
            <AppLayout role={role} onRoleChange={setRole} title="Platform overview" subtitle="Usage and detection trends">
              <AdminDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/app/admin/users"
          element={
            <AppLayout role={role} onRoleChange={setRole} title="Users" subtitle="Manage registered accounts">
              <AdminUsers />
            </AppLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}