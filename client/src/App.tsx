import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { PortalLayout } from "./components/PortalLayout";
import { LoadingState } from "./components/ui";
import { BookDetailPage } from "./pages/BookDetailPage";
import { BooksPage } from "./pages/BooksPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NewTicketPage } from "./pages/NewTicketPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { TicketsPage } from "./pages/TicketsPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminTicketsPage } from "./pages/admin/AdminTicketsPage";
import { AdminTicketDetailPage } from "./pages/admin/AdminTicketDetailPage";

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen bg-[#f5f7f4] p-6"><LoadingState label="Preparing your author portal…" /></div>;
  if (!user) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/signup" element={<LoginPage mode="signup" />} />
        <Route path="*" element={<LoginPage mode="login" />} />
      </Routes>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminTicketsPage />} />
          <Route path="tickets" element={<AdminTicketsPage />} />
          <Route path="tickets/:ticketId" element={<AdminTicketDetailPage />} />
          <Route path="*" element={<Navigate to="/tickets" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="books/:bookId" element={<BookDetailPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
        <Route path="support/new" element={<NewTicketPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
