import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, X, Clock, MapPin } from "lucide-react";

import { api } from "@/lib/mock/api";
import type { Application, Job } from "@/lib/mock/types";
import { DataGrid, type GridColumn } from "@/components/admin/DataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/jobs")({
  component: JobsPage,
});

function JobsPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  const columns: GridColumn<Job>[] = [
    {
      key: "title",
      header: "Position",
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sky-50 text-sky-600">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{r.title}</div>
            <div className="truncate text-xs text-muted-foreground">{r.companyName}</div>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", sortable: true, cell: (r) => <StatusPill tone="muted">{r.category}</StatusPill> },
    { key: "location", header: "Location", cell: (r) => <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {r.location}</span> },
    { key: "urgency", header: "Urgency", sortable: true, cell: (r) => <StatusPill tone={r.urgency === "High" ? "danger" : r.urgency === "Medium" ? "warning" : "muted"}>{r.urgency}</StatusPill> },
    { key: "applicationCount", header: "Applicants", sortable: true, cell: (r) => <span className="font-medium text-foreground">{r.applicationCount}</span> },
    { key: "status", header: "Status", sortable: true, cell: (r) => <StatusPill tone={r.status === "Open" ? "success" : r.status === "Draft" ? "muted" : "danger"}>{r.status}</StatusPill> },
    { key: "createdAt", header: "Posted", sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Global Jobs & Application Pipeline</h2>
        <p className="text-sm text-muted-foreground">Audit every job posting and drill into the application history.</p>
      </div>

      <DataGrid<Job>
        queryKey={["jobs"]}
        fetchPage={(p) => api.listJobs(p)}
        columns={columns}
        searchPlaceholder="Search by title, company, category…"
        initialSort={{ sortBy: "createdAt", sortDir: "desc" }}
        filters={[
          { key: "status", label: "Status", options: ["Open","Closed","Draft"].map((v) => ({ value: v, label: v })) },
          { key: "urgency", label: "Urgency", options: ["Low","Medium","High"].map((v) => ({ value: v, label: v })) },
          { key: "category", label: "Category", options: ["Engineering","Design","Sales","Marketing","Operations","Support","Finance","HR"].map((v) => ({ value: v, label: v })) },
        ]}
        onRowClick={(r) => setJobId(r._id)}
      />

      <Sheet open={!!jobId} onOpenChange={(o) => !o && setJobId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {jobId && <ApplicationsPanel jobId={jobId} onPickApp={(id) => setAppId(id)} />}
        </SheetContent>
      </Sheet>

      <Sheet open={!!appId} onOpenChange={(o) => !o && setAppId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {appId && <ApplicationDetail id={appId} onClose={() => setAppId(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ApplicationsPanel({ jobId, onPickApp }: { jobId: string; onPickApp: (id: string) => void }) {
  const columns: GridColumn<Application>[] = [
    { key: "seekerName", header: "Candidate", sortable: true, cell: (r) => <div className="font-medium">{r.seekerName}</div> },
    { key: "status", header: "Status", sortable: true, cell: (r) => <StatusPill tone={r.status === "Hired" ? "success" : r.status === "Rejected" ? "danger" : r.status === "Shortlisted" ? "info" : "muted"}>{r.status}</StatusPill> },
    { key: "createdAt", header: "Applied", sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span> },
    { key: "actions", header: "", width: "1%", cell: (r) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onPickApp(r._id); }}>Open</Button> },
  ];
  return (
    <>
      <SheetHeader>
        <SheetTitle>Application Pipeline</SheetTitle>
        <SheetDescription>All applicants for this position.</SheetDescription>
      </SheetHeader>
      <div className="mt-6">
        <DataGrid<Application>
          queryKey={["applications", jobId]}
          fetchPage={(p) => api.listApplications({ ...p, jobId })}
          columns={columns}
          searchPlaceholder="Search applicants…"
          initialSort={{ sortBy: "createdAt", sortDir: "desc" }}
          filters={[{ key: "status", label: "Status", options: ["Applied","Reviewed","Shortlisted","Rejected","Hired"].map((v) => ({ value: v, label: v })) }]}
          pageSize={10}
        />
      </div>
    </>
  );
}

function ApplicationDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useQuery({ queryKey: ["application", id], queryFn: () => api.getApplication(id) });
  if (!data) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
  return (
    <>
      <SheetHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <SheetTitle>{data.seekerName}</SheetTitle>
            <SheetDescription>Applied to {data.jobTitle}</SheetDescription>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
      </SheetHeader>
      <div className="mt-6 space-y-5">
        <section>
          <h4 className="text-sm font-semibold text-foreground">Cover letter</h4>
          <p className="mt-1 rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground">{data.coverLetter}</p>
        </section>
        <section>
          <a href={data.resumeUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
            View resume →
          </a>
        </section>
        <section>
          <h4 className="text-sm font-semibold text-foreground">Status history</h4>
          <ol className="mt-3 space-y-3 border-l border-border pl-5">
            {data.statusHistory.map((s, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[26px] top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{i + 1}</span>
                <div className="flex items-center gap-2">
                  <StatusPill tone={s.status === "Hired" ? "success" : s.status === "Rejected" ? "danger" : "info"}>{s.status}</StatusPill>
                  <span className="text-xs text-muted-foreground">by {s.changedBy}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" />{new Date(s.changedAt).toLocaleString()}</div>
                {s.note && <div className="mt-1 text-xs text-foreground">{s.note}</div>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
