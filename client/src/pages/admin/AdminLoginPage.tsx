import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { LoginPage } from "../LoginPage";

export function AdminLoginPage() {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <Navigate to="/tickets" replace />;
  return <LoginPage mode="login" portal="admin" />;
}
