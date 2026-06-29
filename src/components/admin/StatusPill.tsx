import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "muted";

const toneClasses: Record<Tone, string> = {
  success: "bg-success/10 text-success-foreground ring-success/30",
  warning: "bg-warning/15 text-warning-foreground ring-warning/40",
  danger: "bg-destructive/10 text-destructive ring-destructive/30",
  info: "bg-primary/10 text-primary ring-primary/20",
  muted: "bg-muted text-muted-foreground ring-border",
};

const toneText: Record<Tone, string> = {
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-rose-700",
  info: "text-slate-700",
  muted: "text-slate-600",
};

const toneBg: Record<Tone, string> = {
  success: "bg-emerald-50 ring-emerald-200",
  warning: "bg-amber-50 ring-amber-200",
  danger: "bg-rose-50 ring-rose-200",
  info: "bg-slate-100 ring-slate-200",
  muted: "bg-slate-50 ring-slate-200",
};

export function StatusPill({
  tone = "muted",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  // Override with explicit Emerald / Amber / Rose semantic colors as per design system
  void toneClasses;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneBg[tone],
        toneText[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
