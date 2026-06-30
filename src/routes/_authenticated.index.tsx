import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users as UsersIcon,
  Building2,
  Briefcase,
  LifeBuoy,
  CreditCard,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Clock,
  Bell,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
} from "recharts";
import { api } from "@/lib/mock/api";
import { StatusPill } from "@/components/admin/StatusPill";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

const cards = [
  { key: "activeCandidates", label: "Active Candidates", icon: UsersIcon, tone: "text-emerald-600", bg: "bg-emerald-50", delta: "+12.4%", up: true },
  { key: "premiumEnterprises", label: "Premium Enterprises", icon: Building2, tone: "text-violet-600", bg: "bg-violet-50", delta: "+5.8%", up: true },
  { key: "openJobs", label: "Open Vacancies", icon: Briefcase, tone: "text-sky-600", bg: "bg-sky-50", delta: "+18.2%", up: true },
  { key: "openTickets", label: "Open Tickets", icon: LifeBuoy, tone: "text-amber-600", bg: "bg-amber-50", delta: "-3.1%", up: false },
  { key: "activeSubscriptions", label: "Active Subscriptions", icon: CreditCard, tone: "text-rose-600", bg: "bg-rose-50", delta: "+9.6%", up: true },
  { key: "pendingVerifications", label: "Pending Verifications", icon: ShieldAlert, tone: "text-orange-600", bg: "bg-orange-50", delta: "-7.4%", up: false },
] as const;

const ROLE_COLORS = ["#10b981", "#0ea5e9", "#f59e0b"];
const CATEGORY_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444"];

function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.stats });
  const { data: trends } = useQuery({ queryKey: ["trends"], queryFn: api.chartTrends });
  const { data: jobs } = useQuery({ queryKey: ["dash-jobs"], queryFn: () => api.listJobs({ page: 1, pageSize: 200 }) });
  const { data: users } = useQuery({ queryKey: ["dash-users"], queryFn: () => api.listUsers({ page: 1, pageSize: 200 }) });
  const { data: tickets } = useQuery({ queryKey: ["dash-tickets"], queryFn: () => api.listTickets({ page: 1, pageSize: 200 }) });
  const { data: audit } = useQuery({ queryKey: ["dash-audit"], queryFn: () => api.listAudit({ page: 1, pageSize: 8, sortBy: "createdAt", sortDir: "desc" }) });

  const roleDist = (() => {
    if (!users) return [];
    const counts: Record<string, number> = { seeker: 0, business: 0, admin: 0 };
    users.data.forEach((u) => (counts[u.role] = (counts[u.role] ?? 0) + 1));
    return [
      { name: "Seekers", value: counts.seeker },
      { name: "Businesses", value: counts.business },
      { name: "Admins", value: counts.admin },
    ];
  })();

  const jobCategories = (() => {
    if (!jobs) return [];
    const counts: Record<string, number> = {};
    jobs.data.forEach((j) => (counts[j.category] = (counts[j.category] ?? 0) + 1));
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  })();

  const ticketsByPriority = (() => {
    if (!tickets) return [];
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    tickets.data.forEach((t) => (counts[t.priority] = (counts[t.priority] ?? 0) + 1));
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const funnel = [
    { name: "Applied", value: 100, fill: "#0ea5e9" },
    { name: "Reviewed", value: 72, fill: "#6366f1" },
    { name: "Shortlisted", value: 41, fill: "#f59e0b" },
    { name: "Hired", value: 18, fill: "#10b981" },
  ];

  const revenue = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    revenue: 80000 + ((i * 23) % 40) * 2400 + (i % 3) * 5000,
    target: 110000 + i * 3000,
  }));

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-slate-50 shadow-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-16 right-24 h-44 w-44 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="relative grid gap-4 sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Operations Command Center
            </div>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Welcome back, Admin.</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Real-time telemetry across candidates, enterprises and revenue. All systems nominal — 99.98% uptime over the last 30 days.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <HeroMetric label="Uptime" value="99.98%" tone="emerald" />
            <HeroMetric label="MRR" value="₹4.82L" tone="sky" />
            <HeroMetric label="Conversion" value="6.4%" tone="amber" />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          const value = stats ? (stats as Record<string, number>)[c.key] : null;
          return (
            <div key={c.key} className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className={`grid h-9 w-9 place-items-center rounded-md ${c.bg}`}>
                  <Icon className={`h-4 w-4 ${c.tone}`} />
                </div>
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${c.up ? "text-emerald-600" : "text-rose-600"}`}>
                  {c.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {c.delta}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-foreground">
                  {value == null ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" /> : value.toLocaleString()}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.label}</div>
              </div>
              <div className={`absolute inset-x-0 bottom-0 h-0.5 ${c.up ? "bg-emerald-500" : "bg-rose-500"} opacity-0 transition-opacity group-hover:opacity-100`} />
            </div>
          );
        })}
      </div>

      {/* Throughput + Health */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Platform throughput</h3>
              <p className="text-xs text-muted-foreground">Monthly candidates, jobs, and successful hires.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends ?? []}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g3" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="candidates" stroke="#10b981" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="jobs" stroke="#0ea5e9" fill="url(#g2)" strokeWidth={2} />
                <Area type="monotone" dataKey="hires" stroke="#f59e0b" fill="url(#g3)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">User distribution</h3>
          <p className="text-xs text-muted-foreground">Breakdown by primary role.</p>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleDist} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                  {roleDist.map((_, i) => <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {roleDist.map((r, i) => (
              <li key={r.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: ROLE_COLORS[i] }} />
                  <span className="text-foreground">{r.name}</span>
                </span>
                <span className="font-medium text-foreground">{r.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Revenue + Funnel + Tickets */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Revenue vs target</h3>
              <p className="text-xs text-muted-foreground">Monthly subscription revenue trajectory.</p>
            </div>
            <StatusPill tone="success"><TrendingUp className="h-3 w-3" /> On track</StatusPill>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">Hiring funnel</h3>
          <p className="text-xs text-muted-foreground">Application stage conversion.</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="25%" outerRadius="100%" data={funnel} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" background cornerRadius={6} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-1 space-y-1 text-xs">
            {funnel.map((f) => (
              <li key={f.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: f.fill }} />{f.name}</span>
                <span className="font-medium">{f.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Categories + Priority + Activity */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">Jobs by category</h3>
          <p className="text-xs text-muted-foreground">Top hiring verticals.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobCategories} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {jobCategories.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">Tickets by priority</h3>
          <p className="text-xs text-muted-foreground">Distribution across SLA tiers.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {ticketsByPriority.map((entry, i) => (
                    <Cell key={i} fill={["#94a3b8", "#0ea5e9", "#f59e0b", "#ef4444"][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">System health</h3>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xs text-muted-foreground">All subsystems monitored.</p>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { name: "API Gateway", value: "Operational", tone: "emerald", pct: 100 },
              { name: "Database Cluster", value: "Operational", tone: "emerald", pct: 99 },
              { name: "Notification Service", value: "Degraded", tone: "amber", pct: 78 },
              { name: "Search Index", value: "Operational", tone: "emerald", pct: 100 },
              { name: "Background Jobs", value: "Operational", tone: "emerald", pct: 97 },
            ].map((s) => (
              <li key={s.name}>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">{s.name}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.tone === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {s.value}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${s.tone === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${s.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Activity + Quick actions */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" /> Recent admin activity
            </h3>
            <Link to="/audit-logs" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View audit logs <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {(audit?.data ?? []).map((a) => (
              <li key={a._id} className="flex items-start gap-3 py-3 text-sm">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {a.userName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-foreground">{a.userName}</span>
                    <span className="text-xs text-muted-foreground">{a.action.replace(/_/g, " ").toLowerCase()}</span>
                    <span className="text-xs text-muted-foreground">on {a.targetEntity}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>IP {a.ip}</span>
                    <span>·</span>
                    <span>{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </li>
            ))}
            {!audit && Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="py-3"><div className="h-8 w-full animate-pulse rounded bg-muted" /></li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Bell className="h-4 w-4 text-primary" /> Quick actions
          </h3>
          <p className="text-xs text-muted-foreground">Jump to common workflows.</p>
          <div className="mt-4 grid gap-2">
            <QuickLink to="/businesses" label="Review verifications" hint={`${stats?.pendingVerifications ?? "—"} pending`} icon={ShieldAlert} tone="bg-orange-50 text-orange-600" />
            <QuickLink to="/tickets" label="Triage tickets" hint={`${stats?.openTickets ?? "—"} open`} icon={LifeBuoy} tone="bg-amber-50 text-amber-600" />
            <QuickLink to="/jobs" label="Manage job posts" hint={`${stats?.openJobs ?? "—"} live`} icon={Briefcase} tone="bg-sky-50 text-sky-600" />
            <QuickLink to="/notifications" label="Send broadcast" hint="Reach audiences" icon={Bell} tone="bg-violet-50 text-violet-600" />
            <QuickLink to="/users" label="Manage users" hint="Profiles & access" icon={UsersIcon} tone="bg-emerald-50 text-emerald-600" />
          </div>
          <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-200">
            <div className="flex items-center gap-1.5 font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> All compliance checks passed</div>
            <p className="mt-1">Last security scan completed 2 hours ago. No outstanding policy violations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "sky" | "amber" }) {
  const map = { emerald: "from-emerald-400/20 to-emerald-500/5 ring-emerald-300/30 text-emerald-200", sky: "from-sky-400/20 to-sky-500/5 ring-sky-300/30 text-sky-200", amber: "from-amber-400/20 to-amber-500/5 ring-amber-300/30 text-amber-200" }[tone];
  return (
    <div className={`rounded-xl bg-gradient-to-br ${map} px-4 py-3 ring-1 ring-inset backdrop-blur`}>
      <div className="text-[10px] uppercase tracking-widest opacity-80">{label}</div>
      <div className="text-xl font-semibold text-slate-50">{value}</div>
    </div>
  );
}

function QuickLink({ to, label, hint, icon: Icon, tone }: { to: string; label: string; hint: string; icon: React.ElementType; tone: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
