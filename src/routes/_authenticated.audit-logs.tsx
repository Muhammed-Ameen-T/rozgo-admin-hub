import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";

import { api } from "@/lib/mock/api";
import type { AuditLog } from "@/lib/mock/types";
import { DataGrid, type GridColumn } from "@/components/admin/DataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  component: AuditPage,
});

function AuditPage() {
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const columns: GridColumn<AuditLog>[] = [
    { key: "createdAt", header: "Timestamp", sortable: true, cell: (r) => <span className="font-mono text-xs">{new Date(r.createdAt).toLocaleString()}</span> },
    { key: "userName", header: "Actor", sortable: true, cell: (r) => <span className="text-sm">{r.userName}</span> },
    { key: "action", header: "Action", sortable: true, cell: (r) => <StatusPill tone={r.action.includes("REJECT") || r.action.includes("BLOCK") ? "danger" : r.action.includes("APPROVE") || r.action.includes("VERIFI") ? "success" : "info"}>{r.action}</StatusPill> },
    { key: "targetEntity", header: "Entity", sortable: true, cell: (r) => <span className="text-sm">{r.targetEntity}</span> },
    { key: "targetId", header: "Target", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.targetId}</span> },
    { key: "ip", header: "IP", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ip}</span> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">System Integrity Monitor</h2>
        <p className="text-sm text-muted-foreground">Read-only audit trail of every privileged action.</p>
      </div>

      <DataGrid<AuditLog>
        queryKey={["audit"]}
        fetchPage={(p) => api.listAudit(p)}
        columns={columns}
        searchPlaceholder="Search by action, entity, user, IP…"
        initialSort={{ sortBy: "createdAt", sortDir: "desc" }}
        filters={[
          { key: "targetEntity", label: "Entity", options: ["User","Business","Job","Ticket","Plan","Notification"].map((v) => ({ value: v, label: v })) },
        ]}
        onRowClick={(r) => setSelected(r)}
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle>{selected.action}</SheetTitle>
                    <SheetDescription>{new Date(selected.createdAt).toLocaleString()}</SheetDescription>
                  </div>
                  <button onClick={() => setSelected(null)} className="rounded-md p-1.5 hover:bg-accent" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Actor" value={selected.userName} />
                  <Field label="IP address" value={selected.ip} mono />
                  <Field label="Entity" value={selected.targetEntity} />
                  <Field label="Target ID" value={selected.targetId} mono />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DiffBox label="Old value" data={selected.oldValue} />
                  <DiffBox label="New value" data={selected.newValue} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono text-xs" : "text-sm"} text-foreground`}>{value}</div>
    </div>
  );
}

function DiffBox({ label, data }: { label: string; data?: Record<string, unknown> }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <pre className="mt-1 overflow-x-auto text-[11px] leading-snug text-foreground">
{JSON.stringify(data ?? {}, null, 2)}
      </pre>
    </div>
  );
}
