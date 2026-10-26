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
import ProtectedPage from "./components/ProtectedPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/app/scan"
          element={
            <ProtectedPage allow={["user"]} title="Scan" subtitle="Check a URL or file before you open it">
              <UserDashboard />
            </ProtectedPage>
          }
        />
        <Route
          path="/app/history"
          element={
            <ProtectedPage allow={["user"]} title="Scan history" subtitle="Everything you've submitted so far">
              <ScanHistory />
            </ProtectedPage>
          }
        />
        <Route
          path="/app/pricing"
          element={
            <ProtectedPage allow={["user"]} title="Plans and pricing" subtitle="Pick the plan that fits you">
              <Pricing />
            </ProtectedPage>
          }
        />
        <Route
          path="/app/analyst"
          element={
            <ProtectedPage allow={["analyst"]} title="Review queue" subtitle="Low-confidence scans awaiting a human call">
              <AnalystDashboard />
            </ProtectedPage>
          }
        />
        <Route
          path="/app/admin"
          element={
            <ProtectedPage allow={["admin"]} title="Platform overview" subtitle="Usage and detection trends">
              <AdminDashboard />
            </ProtectedPage>
          }
        />
        <Route
          path="/app/admin/users"
          element={
            <ProtectedPage allow={["admin"]} title="Users" subtitle="Manage registered accounts">
              <AdminUsers />
            </ProtectedPage>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}