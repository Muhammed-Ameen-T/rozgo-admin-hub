import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  const { token } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) navigate({ to: "/login", replace: true });
  }, [token, navigate]);
  if (!token) return null;
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
