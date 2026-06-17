import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "super_admin" | "admin" | "staff" | "artisan" | "customer";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  phone: string | null;
  language: string;
}

export const TEST_ACCOUNTS: AuthUser[] = [
  { id: 1, email: "super_admin@gorillaguardians.rw", name: "Jean-Paul Habimana", role: "super_admin", avatar: null, phone: "+250788000001", language: "en" },
  { id: 2, email: "admin@gorillaguardians.rw", name: "Marie Uwimana", role: "admin", avatar: null, phone: "+250788000002", language: "en" },
  { id: 3, email: "staff@gorillaguardians.rw", name: "Emmanuel Nkurunziza", role: "staff", avatar: null, phone: "+250788000003", language: "en" },
  { id: 4, email: "artisan@gorillaguardians.rw", name: "Celestine Mukamana", role: "artisan", avatar: null, phone: "+250788000004", language: "en" },
  { id: 5, email: "customer@gorillaguardians.rw", name: "Sarah Johnson", role: "customer", avatar: null, phone: "+14155550100", language: "en" },
];

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginAs: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("gg_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("gg_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("gg_user");
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (password !== "admin123") {
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      return true;
    }
    const testUser = TEST_ACCOUNTS.find(u => u.email === email);
    if (testUser) {
      setUser(testUser);
      return true;
    }
    return false;
  };

  const loginAs = (u: AuthUser) => setUser(u);

  const logout = () => {
    setUser(null);
    const apiBase = import.meta.env.VITE_API_URL ?? "";
    fetch(`${apiBase}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  };

  const hasRole = (...roles: UserRole[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, login, loginAs, logout, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getRedirectPath(role: UserRole): string {
  if (role === "super_admin" || role === "admin") return "/admin/dashboard";
  if (role === "staff") return "/staff/dashboard";
  if (role === "artisan") return "/artisan/dashboard";
  return "/customer/dashboard";
}
