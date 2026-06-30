import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ShieldX, Mail } from "lucide-react";

import { api } from "@/lib/mock/api";
import type { User } from "@/lib/mock/types";
import { DataGrid, type GridColumn } from "@/components/admin/DataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const toggleBlock = useMutation({
    mutationFn: (id: string) => api.toggleUserBlock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Account lock updated");
    },
  });
  const toggleVerified = useMutation({
    mutationFn: (id: string) => api.toggleUserVerified(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Verification status updated");
    },
  });

  const columns: GridColumn<User>[] = [
    {
      key: "fullName",
      header: "Profile",
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {r.fullName.split(" ").map((s) => s[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{r.fullName}</div>
            <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="h-3 w-3" /> {r.email}
            </div>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", sortable: true, cell: (r) => <StatusPill tone={r.role === "business" ? "info" : "muted"}>{r.role}</StatusPill> },
    { key: "isVerified", header: "Verified", sortable: true, cell: (r) => <StatusPill tone={r.isVerified ? "success" : "warning"}>{r.isVerified ? "Verified" : "Pending"}</StatusPill> },
    { key: "isBlocked", header: "Status", sortable: true, cell: (r) => <StatusPill tone={r.isBlocked ? "danger" : "success"}>{r.isBlocked ? "Blocked" : "Active"}</StatusPill> },
    { key: "createdAt", header: "Joined", sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span> },
    {
      key: "actions",
      header: "Actions",
      width: "1%",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => toggleVerified.mutate(r._id)}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Verify
          </Button>
          <Button size="sm" variant={r.isBlocked ? "outline" : "destructive"} onClick={() => toggleBlock.mutate(r._id)}>
            <ShieldX className="mr-1 h-3.5 w-3.5" /> {r.isBlocked ? "Unblock" : "Block"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">User & Seeker Profiles</h2>
        <p className="text-sm text-muted-foreground">Manage every account on the platform.</p>
      </div>

      <DataGrid<User>
        queryKey={["users"]}
        fetchPage={(p) => api.listUsers(p)}
        columns={columns}
        searchPlaceholder="Search by name, email, phone…"
        initialSort={{ sortBy: "createdAt", sortDir: "desc" }}
        filters={[
          { key: "role", label: "Roles", options: [{ value: "seeker", label: "Seekers" }, { value: "business", label: "Businesses" }, { value: "admin", label: "Admins" }] },
          { key: "isBlocked", label: "Status", options: [{ value: "false", label: "Active" }, { value: "true", label: "Blocked" }] },
        ]}
        onRowClick={(r) => navigate({ to: "/users/$id", params: { id: r._id } })}
      />
    </div>
  );
}
