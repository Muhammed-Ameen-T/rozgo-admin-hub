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
  const [selected, setSelected] = useState<User | null>(null);

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
        onRowClick={(r) => setSelected(r)}
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && <UserDetail user={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function UserDetail({ user, onClose }: { user: User; onClose: () => void }) {
  const { data: profile } = useQuery({
    queryKey: ["seeker", user._id],
    queryFn: () => api.getSeekerProfile(user._id),
    enabled: user.role === "seeker",
  });
  const [docOpen, setDocOpen] = useState(false);

  return (
    <>
      <SheetHeader>
        <div className="flex items-start justify-between">
          <div>
            <SheetTitle>{user.fullName}</SheetTitle>
            <SheetDescription>{user.email}</SheetDescription>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </SheetHeader>
      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Role" value={user.role} />
          <Field label="Phone" value={user.phone ?? "—"} />
          <Field label="Status" value={user.isBlocked ? "Blocked" : "Active"} />
          <Field label="Verified" value={user.isVerified ? "Yes" : "No"} />
          <Field label="Joined" value={new Date(user.createdAt).toLocaleString()} />
        </div>

        {user.role === "seeker" && profile && (
          <div className="rounded-md border border-border bg-card p-4">
            <h4 className="text-sm font-semibold text-foreground">Seeker profile</h4>
            <p className="mt-1 text-xs text-muted-foreground">{profile.headline}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field label="Experience" value={`${profile.experienceYears} yrs`} />
              <Field label="Location" value={profile.location ?? "—"} />
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-muted-foreground">Skills</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {profile.skills.map((s) => <StatusPill key={s} tone="muted">{s}</StatusPill>)}
              </div>
            </div>
            {profile.resumeUrl && (
              <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => setDocOpen(true)}>
                <FileText className="mr-1 h-3.5 w-3.5" /> Preview resume
              </Button>
            )}
          </div>
        )}

        {docOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setDocOpen(false)}>
            <div className="relative w-full max-w-3xl rounded-lg bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setDocOpen(false)} className="absolute right-3 top-3 rounded-md p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
              <h3 className="text-base font-semibold">{profile?.resumeName}</h3>
              <div className="mt-4 grid h-96 place-items-center rounded-md border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10" />
                  Resume document preview
                  <span className="font-mono text-xs">{profile?.resumeUrl}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
