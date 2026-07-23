import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  ShieldCheck,
  ShieldX,
  Building2,
  Globe,
  Users as UsersIcon,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { api } from "@/config/axios.config";
import { api as mockApi } from "@/lib/mock/api";
import { StatusPill } from "@/components/admin/StatusPill";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/users/$id")({
  component: UserDetailPage,
});

function UserDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["user-detail", id],
    queryFn: async () => {
      const response = await api.get(`/admin/users/${id}`);
      return response.data.data;
    },
  });

  const toggleBlock = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/admin/users/${id}/block`);
      return response.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-detail", id] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Account lock updated");
    },
  });
  const toggleVerified = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/admin/users/${id}/verify`);
      return response.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-detail", id] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Verification status updated");
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const { user } = data;
  const initials = user.fullName.split(" ").filter(Boolean).map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <Link to="/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      {/* Identity header */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700" />
        <div className="-mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6 px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left min-w-0">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border-4 border-card bg-primary text-2xl font-bold text-primary-foreground shadow-md select-none">
              {initials}
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="space-y-1.5 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">{user.fullName}</h1>
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  <StatusPill tone={user.role === "business" ? "info" : "muted"}>{user.role}</StatusPill>
                  {user.isVerified ? (
                    <StatusPill tone="success"><ShieldCheck className="mr-0.5 h-3 w-3 inline" /> Verified</StatusPill>
                  ) : (
                    <StatusPill tone="warning">Pending verification</StatusPill>
                  )}
                  {user.isBlocked && <StatusPill tone="danger"><ShieldX className="mr-0.5 h-3 w-3 inline" /> Blocked</StatusPill>}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 shrink-0" /> {user.email}</span>
                {user.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 shrink-0" /> {user.phone}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 shrink-0" /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => toggleVerified.mutate()} className="h-9">
              <CheckCircle2 className="mr-1 h-4 w-4 text-emerald-500" /> {user.isVerified ? "Unverify" : "Verify"}
            </Button>
            <Button size="sm" variant={user.isBlocked ? "outline" : "destructive"} onClick={() => toggleBlock.mutate()} className="h-9">
              <ShieldX className="mr-1 h-4 w-4" /> {user.isBlocked ? "Unblock" : "Block"}
            </Button>
          </div>
        </div>
      </div>

      {data.kind === "seeker" ? <SeekerView data={data} /> : <BusinessView data={data} />}
    </div>
  );
}

type SeekerData = Extract<Awaited<ReturnType<typeof mockApi.getUserDetail>>, { kind: "seeker" }>;
type BusinessData = Extract<Awaited<ReturnType<typeof mockApi.getUserDetail>>, { kind: "business" }>;

function SectionCard({ title, icon: Icon, children, actions }: { title: string; icon: React.ElementType; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </h3>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StatTile({ label, value, tone = "muted" }: { label: string; value: number | string; tone?: "muted" | "success" | "info" | "warning" }) {
  const toneBg = { muted: "bg-slate-50 text-slate-700", success: "bg-emerald-50 text-emerald-700", info: "bg-sky-50 text-sky-700", warning: "bg-amber-50 text-amber-700" }[tone];
  return (
    <div className={`rounded-lg px-4 py-3 ${toneBg}`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function SeekerView({ data }: { data: SeekerData }) {
  const p = data.profile;
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        {p && (
          <>
            <SectionCard title="About" icon={Sparkles}>
              <p className="text-sm text-foreground">{p.bio}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <KV label="Gender" value={p.gender} />
                <KV label="DOB" value={new Date(p.dob).toLocaleDateString()} />
                <KV label="Category" value={p.category} />
                <KV label="Experience" value={`${p.experienceYears} yrs`} />
              </div>
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Skills</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.skills.map((s) => <StatusPill key={s} tone="info">{s}</StatusPill>)}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Languages</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.languages.map((l) => <StatusPill key={l.lang} tone="muted">{l.lang} · {l.level}</StatusPill>)}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Experience" icon={Briefcase}>
              <ol className="relative space-y-5 border-l border-border pl-5">
                {p.experience.map((e, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="font-medium text-foreground">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(e.startDate).getFullYear()} – {new Date(e.endDate).getFullYear()}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{e.company} · {e.location}</div>
                    <p className="mt-1 text-sm text-foreground">{e.description}</p>
                  </li>
                ))}
              </ol>
            </SectionCard>

            <SectionCard title="Education" icon={GraduationCap}>
              <ul className="space-y-3">
                {p.education.map((ed, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-foreground">{ed.degree} · {ed.fieldOfStudy}</div>
                      <div className="text-sm text-muted-foreground">{ed.institution}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(ed.startDate).getFullYear()} – {new Date(ed.endDate).getFullYear()}</div>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Certificates" icon={Award}>
              <div className="grid gap-3 sm:grid-cols-2">
                {p.certificates.map((c, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{c.issuer} · {new Date(c.issueDate).toLocaleDateString()}</div>
                    <a href={c.certUrl} className="mt-2 inline-block text-xs text-primary hover:underline" target="_blank" rel="noreferrer">Verify ↗</a>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </div>

      <div className="space-y-5">
        <SectionCard title="Activity" icon={UsersIcon}>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Applied" value={data.stats.applications} tone="info" />
            <StatTile label="Shortlisted" value={data.stats.shortlisted} tone="warning" />
            <StatTile label="Hired" value={data.stats.hired} tone="success" />
          </div>
        </SectionCard>

        {p?.resumeUrl && (
          <SectionCard title="Resume" icon={FileText}>
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-2 text-sm font-medium text-foreground">{p.resumeName}</div>
              <a href={p.resumeUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-primary hover:underline">
                Open document ↗
              </a>
            </div>
          </SectionCard>
        )}

        {p && (
          <SectionCard title="Location" icon={MapPin}>
            <div className="text-sm text-foreground">{p.location}</div>
          </SectionCard>
        )}

        <SectionCard title="Recent applications" icon={Briefcase}>
          {data.recentApplications.length === 0 ? (
            <div className="text-sm text-muted-foreground">No applications yet.</div>
          ) : (
            <ul className="space-y-2">
              {data.recentApplications.map((a) => (
                <li key={a._id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                  <span className="truncate text-foreground">{a.jobTitle}</span>
                  <StatusPill tone={a.status === "Hired" ? "success" : a.status === "Rejected" ? "danger" : "muted"}>{a.status}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function BusinessView({ data }: { data: BusinessData }) {
  const p = data.profile;
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        {p && (
          <>
            <SectionCard title="Company" icon={Building2}>
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-foreground">{p.companyName}</div>
                  <div className="text-sm text-muted-foreground">{p.industry} · {p.employeeCount} employees</div>
                  <p className="mt-2 text-sm text-foreground">{p.description}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <KV label="Website" value={p.website ?? "—"} />
                <KV label="Business email" value={p.businessEmail} />
                <KV label="Business phone" value={p.businessPhone} />
                <KV label="Owner contact" value={p.ownerNumber ?? "—"} />
                <KV label="Premium" value={p.isPremium ? "Yes" : "No"} />
                <KV label="Created" value={new Date(p.createdAt).toLocaleDateString()} />
              </div>
            </SectionCard>

            <SectionCard title="Verification documents" icon={ShieldCheck}>
              <div className="space-y-2">
                {p.verificationDocuments.map((d) => (
                  <div key={d._id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{d.docType}</div>
                        <div className="truncate text-xs text-muted-foreground">{d.originalName}</div>
                      </div>
                    </div>
                    <StatusPill tone={d.status === "Approved" ? "success" : d.status === "Rejected" ? "danger" : "warning"}>
                      {d.status === "Approved" ? <CheckCircle2 className="h-3 w-3" /> : d.status === "Rejected" ? <XCircle className="h-3 w-3" /> : null}
                      {d.status}
                    </StatusPill>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Recent jobs" icon={Briefcase}>
              {data.recentJobs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No job postings yet.</div>
              ) : (
                <ul className="space-y-2">
                  {data.recentJobs.map((j) => (
                    <li key={j._id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{j.title}</div>
                        <div className="text-xs text-muted-foreground">{j.category} · {j.location}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill tone={j.urgency === "High" ? "danger" : j.urgency === "Medium" ? "warning" : "muted"}>{j.urgency}</StatusPill>
                        <StatusPill tone={j.status === "Open" ? "success" : "muted"}>{j.status}</StatusPill>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </>
        )}
      </div>

      <div className="space-y-5">
        <SectionCard title="Performance" icon={Sparkles}>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Jobs" value={data.stats.totalJobs} tone="info" />
            <StatTile label="Open" value={data.stats.openJobs} tone="success" />
            <StatTile label="Apps" value={data.stats.applications} tone="warning" />
          </div>
        </SectionCard>

        {p && (
          <>
            <SectionCard title="Address" icon={MapPin}>
              <div className="text-sm text-foreground">
                {p.address.street}<br />
                {p.address.locality}, {p.address.city}<br />
                {p.address.state} {p.address.zip}
              </div>
            </SectionCard>

            {p.website && (
              <SectionCard title="Website" icon={Globe}>
                <a href={p.website} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">
                  {p.website}
                </a>
              </SectionCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm text-foreground">{value}</div>
    </div>
  );
}
