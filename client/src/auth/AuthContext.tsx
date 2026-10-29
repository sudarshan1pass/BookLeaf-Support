import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { apiRequest, ApiError } from "../lib/api";
import type { Role } from "../types";

type AuthUser = { id: string; fullName: string; email: string; role: Role };
type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("bookleaf_access_token");
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    toast.success("You’ve been signed out.");
  }, [clearSession]);

  useEffect(() => {
    const handleExpired = () => {
      clearSession();
      toast.error("Your session expired. Please sign in again.");
    };
    window.addEventListener("bookleaf:auth-expired", handleExpired);

    const token = sessionStorage.getItem("bookleaf_access_token");
    if (!token) {
      setReady(true);
      return () => window.removeEventListener("bookleaf:auth-expired", handleExpired);
    }

    void apiRequest<{ user: AuthUser }>("/api/auth/me")
      .then(({ user: currentUser }) => {
        if (currentUser.role === "AUTHOR" || currentUser.role === "ADMIN") setUser(currentUser);
        else clearSession();
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status !== 401) return;
        clearSession();
      })
      .finally(() => setReady(true));

    return () => window.removeEventListener("bookleaf:auth-expired", handleExpired);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<{ user: AuthUser; accessToken: string }>("/api/auth/author/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (result.user.role !== "AUTHOR") throw new ApiError("This portal is for author accounts.", 403, "FORBIDDEN");
    sessionStorage.setItem("bookleaf_access_token", result.accessToken);
    setUser(result.user);
  }, []);

  const signup = useCallback(async (fullName: string, email: string, password: string) => {
    const result = await apiRequest<{ user: AuthUser; accessToken: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password, role: "AUTHOR" }),
    });
    if (result.user.role !== "AUTHOR") throw new ApiError("This portal is for author accounts.", 403, "FORBIDDEN");
    sessionStorage.setItem("bookleaf_access_token", result.accessToken);
    setUser(result.user);
  }, []);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<{ user: AuthUser; accessToken: string }>("/api/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (result.user.role !== "ADMIN") throw new ApiError("This portal is for administrator accounts.", 403, "FORBIDDEN");
    sessionStorage.setItem("bookleaf_access_token", result.accessToken);
    setUser(result.user);
  }, []);

  const value = useMemo(() => ({ user, ready, login, loginAdmin, signup, logout }), [user, ready, login, loginAdmin, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
