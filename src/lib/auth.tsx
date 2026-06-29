import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface AuthUser {
  name: string;
  email: string;
  role: "admin";
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

// In-memory only — never persisted to localStorage to mitigate XSS token theft.
const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      setSession: (t, u) => {
        setToken(t);
        setUser(u);
      },
      signOut: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
