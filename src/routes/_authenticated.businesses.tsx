import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, FileText, ExternalLink, Crown, ShieldCheck, ShieldAlert } from "lucide-react";

import { api } from "@/lib/mock/api";
import type { BusinessProfile, VerificationDoc } from "@/lib/mock/types";
import { DataGrid, type GridColumn } from "@/components/admin/DataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/businesses")({
  component: BusinessesPage,
});

type Row = BusinessProfile & { ownerName: string; ownerEmail: string; pendingDocs: number };

function BusinessesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const columns: GridColumn<Row>[] = [
    {
      key: "companyName",
      header: "Company",
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            {r.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 truncate font-medium text-foreground">
              {r.companyName}
              {r.isPremium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
            </div>
            <div className="truncate text-xs text-muted-foreground">{r.industry}</div>
          </div>
        </div>
      ),
    },
    { key: "ownerName", header: "Owner", sortable: true, cell: (r) => (<div className="min-w-0"><div className="truncate text-sm">{r.ownerName}</div><div className="truncate text-xs text-muted-foreground">{r.ownerEmail}</div></div>) },
    { key: "isPremium", header: "Plan", sortable: true, cell: (r) => <StatusPill tone={r.isPremium ? "info" : "muted"}>{r.isPremium ? "Premium" : "Free"}</StatusPill> },
    {
      key: "pendingDocs",
      header: "Verification",
      sortable: true,
      cell: (r) => (
        <StatusPill tone={r.pendingDocs === 0 ? "success" : "warning"}>
          {r.pendingDocs === 0 ? (<><ShieldCheck className="h-3 w-3" /> Verified</>) : (<><ShieldAlert className="h-3 w-3" /> {r.pendingDocs} pending</>)}
        </StatusPill>
      ),
    },
    { key: "createdAt", header: "Joined", sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span> },
    {
      key: "actions",
      header: "",
      width: "1%",
      cell: (r) => (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedId(r._id); }}>Review docs</Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Corporate Profiles & Verification Vault</h2>
        <p className="text-sm text-muted-foreground">Review business documents and toggle individual approval states.</p>
      </div>

      <DataGrid<Row>
        queryKey={["businesses"]}
        fetchPage={(p) => api.listBusinesses(p)}
        columns={columns}
        searchPlaceholder="Search by company, industry, owner…"
        initialSort={{ sortBy: "createdAt", sortDir: "desc" }}
        filters={[
          { key: "isPremium", label: "Plan", options: [{ value: "true", label: "Premium" }, { value: "false", label: "Free" }] },
          { key: "industry", label: "Industry", options: ["Technology","Healthcare","Finance","Retail","Manufacturing","Education","Logistics"].map((v) => ({ value: v, label: v })) },
        ]}
        onRowClick={(r) => setSelectedId(r._id)}
      />

      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedId && <BusinessDrawer id={selectedId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BusinessDrawer({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["business", id], queryFn: () => api.getBusiness(id) });

  const mutation = useMutation({
    mutationFn: ({ docId, status }: { docId: string; status: VerificationDoc["status"] }) =>
      api.setDocStatus(id, docId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business", id] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
      toast.success("Document status updated");
    },
  });

  if (!data) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">{data.companyName} {data.isPremium && <Crown className="h-4 w-4 text-amber-500" />}</SheetTitle>
        <SheetDescription>{data.industry} · {data.ownerName} ({data.ownerEmail})</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Verification documents</h4>
        {data.verificationDocuments.map((d) => (
          <div key={d._id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{d.docType}</div>
                    <div className="truncate text-xs text-muted-foreground">{d.originalName}</div>
                  </div>
                  <StatusPill tone={d.status === "Approved" ? "success" : d.status === "Rejected" ? "danger" : "warning"}>{d.status}</StatusPill>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  Uploaded {new Date(d.uploadedAt).toLocaleDateString()}
                  <a className="ml-auto inline-flex items-center gap-1 text-primary hover:underline" href={d.docUrl} target="_blank" rel="noreferrer">
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={d.status === "Approved" || mutation.isPending} onClick={() => mutation.mutate({ docId: d._id, status: "Approved" })}>
                    <Check className="mr-1 h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={d.status === "Pending" || mutation.isPending} onClick={() => mutation.mutate({ docId: d._id, status: "Pending" })}>
                    Reset
                  </Button>
                  <Button size="sm" variant="destructive" disabled={d.status === "Rejected" || mutation.isPending} onClick={() => mutation.mutate({ docId: d._id, status: "Rejected" })}>
                    <X className="mr-1 h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
