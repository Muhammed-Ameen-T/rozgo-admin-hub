import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users as UsersIcon,
  Building2,
  Briefcase,
  LifeBuoy,
  CreditCard,
  ShieldAlert,
  TrendingUp,
  ArrowUpRight,
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
} from "recharts";
import { api } from "@/lib/mock/api";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

const cards = [
  { key: "activeCandidates", label: "Active Candidates", icon: UsersIcon, tone: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "premiumEnterprises", label: "Premium Enterprises", icon: Building2, tone: "text-violet-600", bg: "bg-violet-50" },
  { key: "openJobs", label: "Open Vacancies", icon: Briefcase, tone: "text-sky-600", bg: "bg-sky-50" },
  { key: "openTickets", label: "Open Support Tickets", icon: LifeBuoy, tone: "text-amber-600", bg: "bg-amber-50" },
  { key: "activeSubscriptions", label: "Active Subscriptions", icon: CreditCard, tone: "text-rose-600", bg: "bg-rose-50" },
  { key: "pendingVerifications", label: "Pending Verifications", icon: ShieldAlert, tone: "text-orange-600", bg: "bg-orange-50" },
] as const;

function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.stats });
  const { data: trends } = useQuery({ queryKey: ["trends"], queryFn: api.chartTrends });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Operations Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live telemetry across the RozGo platform.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          const value = stats ? (stats as Record<string, number>)[c.key] : null;
          return (
            <div key={c.key} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`grid h-9 w-9 place-items-center rounded-md ${c.bg}`}>
                  <Icon className={`h-4 w-4 ${c.tone}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-foreground">
                  {value == null ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" /> : value.toLocaleString()}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm xl:col-span-2">
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

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">System health</h3>
          <p className="text-xs text-muted-foreground">All subsystems operational.</p>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { name: "API Gateway", value: "Operational", tone: "emerald" },
              { name: "Database Cluster", value: "Operational", tone: "emerald" },
              { name: "Notification Service", value: "Degraded", tone: "amber" },
              { name: "Search Index", value: "Operational", tone: "emerald" },
              { name: "Background Jobs", value: "Operational", tone: "emerald" },
            ].map((s) => (
              <li key={s.name} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                <span className="text-foreground">{s.name}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${s.tone === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                  {s.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
