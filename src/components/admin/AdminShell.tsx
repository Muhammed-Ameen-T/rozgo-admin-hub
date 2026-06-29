import { useState, type ReactNode } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  LifeBuoy,
  HelpCircle,
  BookOpen,
  CreditCard,
  Bell,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/users", label: "Users", icon: Users },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/jobs", label: "Jobs & Applications", icon: Briefcase },
  { to: "/tickets", label: "Support Tickets", icon: LifeBuoy },
  { to: "/faqs", label: "FAQs", icon: HelpCircle },
  { to: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/notifications", label: "Broadcasts", icon: Bell },
  { to: "/audit-logs", label: "Audit Logs", icon: ShieldCheck },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
          R
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">RozGo</span>
          <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Admin Hub</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 text-[11px] text-sidebar-foreground/50">
        v1.0 · Enterprise
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = nav.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-foreground/70 hover:bg-accent lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground md:text-lg">
              {current?.label ?? "Admin"}
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground md:flex md:w-72">
            <Search className="h-4 w-4" />
            <span className="truncate">Quick search</span>
            <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-semibold text-foreground">{user?.name ?? "Admin"}</div>
              <div className="text-[11px] text-muted-foreground">{user?.email ?? ""}</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {(user?.name ?? "A").slice(0, 1)}
            </div>
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/login" });
              }}
              className="rounded-md border border-border p-2 text-foreground/70 hover:bg-accent"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
