import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { api, getAccessToken, setAccessToken, subscribeToTokenChanges } from "@/config/axios.config";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
  profileImage?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  setSession: (token: string, user: AuthUser) => void;
  signOut: () => Promise<void>;
}

// In-memory only — never persisted to localStorage to mitigate XSS token theft.
const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync state with Axios interceptors
  useEffect(() => {
    const unsubscribe = subscribeToTokenChanges((newToken) => {
      setToken(newToken);
      if (!newToken) {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get("/auth/admin/me");
        if (response.data?.success && response.data?.data?.user) {
          setUser(response.data.data.user);
          // If response contains an access token directly, set it. Otherwise fallback to interceptor capture
          const capturedToken = response.data?.data?.accessToken || getAccessToken();
          if (capturedToken) {
            setToken(capturedToken);
            setAccessToken(capturedToken);
          }
        }
      } catch (error) {
        console.log("No active admin session found on load.");
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const signOut = async () => {
    try {
      await api.post("/auth/admin/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      loading,
      setSession: (t, u) => {
        setAccessToken(t);
        setToken(t);
        setUser(u);
      },
      signOut,
    }),
    [token, user, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

