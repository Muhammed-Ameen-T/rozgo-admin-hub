import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  const { token, loading } = useAuth();
  const navigate = useNavigate();
  
  // Monitor admin user activity to automatically log out on inactivity
  useInactivityTimeout();

  useEffect(() => {
    if (!loading && !token) navigate({ to: "/login", replace: true });
  }, [token, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="text-xs">Checking session...</span>
        </div>
      </div>
    );
  }

  if (!token) return null;
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
