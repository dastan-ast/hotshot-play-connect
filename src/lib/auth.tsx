import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoAccounts, users, type Role, type User } from "./mock-db";

interface AuthValue {
  user: User | null;
  isAuthenticated: boolean;
  role: Role | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  loginAs: (role: Role) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthValue | null>(null);
const KEY = "hsp-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored && users.some((u) => u.id === stored)) setUserId(stored);
  }, []);

  const persist = useCallback((id: string | null) => {
    setUserId(id);
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  }, []);

  const value = useMemo<AuthValue>(() => {
    const user = users.find((u) => u.id === userId) ?? null;
    return {
      user,
      isAuthenticated: !!user,
      role: user?.role ?? null,
      login: (email, password) => {
        const account = demoAccounts.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
        );
        if (!account) return { ok: false, error: "invalid" };
        const found = users.find((u) => u.email === account.email);
        if (!found) return { ok: false, error: "invalid" };
        persist(found.id);
        return { ok: true };
      },
      loginAs: (role) => {
        const found = users.find((u) => u.role === role);
        if (found) persist(found.id);
      },
      logout: () => persist(null),
    };
  }, [userId, persist]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const HOME_BY_ROLE: Record<Role, string> = {
  player: "/",
  clubAdmin: "/staff",
  owner: "/partner",
  admin: "/admin",
};
