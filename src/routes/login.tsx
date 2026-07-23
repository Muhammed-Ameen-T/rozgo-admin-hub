import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Mail, Lock, ArrowRight, KeyRound } from "lucide-react";

import { api } from "@/config/axios.config";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · RozGo Admin" }] }),
  component: LoginPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});
type CredForm = z.infer<typeof credSchema>;

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});
type OtpForm = z.infer<typeof otpSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [stage, setStage] = useState<"creds" | "otp">("creds");
  const [email, setEmail] = useState<string | null>(null);

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">R</div>
          <div>
            <div className="text-base font-semibold">RozGo</div>
            <div className="text-xs uppercase tracking-widest text-sidebar-foreground/60">Administrative Hub</div>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl font-semibold leading-tight">
            Operate the RozGo platform with surgical precision.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-sidebar-foreground/70">
            Unified controls for candidates, enterprises, jobs, support and platform integrity — secured behind two-stage authentication.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              { k: "9", v: "Core modules" },
              { k: "RBAC", v: "Role enforcement" },
              { k: "TLS 1.3", v: "Transport" },
            ].map((c) => (
              <div key={c.k} className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3">
                <div className="text-lg font-semibold">{c.k}</div>
                <div className="text-[11px] text-sidebar-foreground/60">{c.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-sidebar-foreground/40">© {new Date().getFullYear()} RozGo · Confidential</div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Shield className="h-4 w-4" />
            Two-stage secure sign-in
          </div>

          {stage === "creds" ? (
            <CredentialsStep
              onSuccess={(userEmail) => {
                setEmail(userEmail);
                setStage("otp");
              }}
            />
          ) : (
            <OtpStep
              email={email!}
              onSuccess={(token, user) => {
                setSession(token, user);
                toast.success("Welcome back");
                navigate({ to: "/" });
              }}
              onBack={() => setStage("creds")}
            />
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Protected by RozGo Trust.
          </p>
        </div>
      </div>
    </div>
  );
}

function CredentialsStep({ onSuccess }: { onSuccess: (email: string) => void }) {
  const form = useForm<CredForm>({
    resolver: zodResolver(credSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({
    mutationFn: async ({ email, password }: CredForm) => {
      const response = await api.post("/auth/admin/login", { email, password });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to log in");
      }
      return email;
    },
    onSuccess: (email) => onSuccess(email),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in to your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Step 1 of 2 — verify your credentials.</p>

      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="mt-8 space-y-4"
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" placeholder="name@company.com" autoComplete="username" className="pl-9" {...form.register("email")} />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs font-medium text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" className="pl-9" {...form.register("password")} />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs font-medium text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Verifying…" : "Continue"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </form>
    </>
  );
}

function OtpStep({
  email,
  onSuccess,
  onBack,
}: {
  email: string;
  onSuccess: (token: string, user: { id: string; name: string; email: string; role: "admin" }) => void;
  onBack: () => void;
}) {
  const [seconds, setSeconds] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const form = useForm<OtpForm>({ resolver: zodResolver(otpSchema), mode: "onBlur" });
  const mutation = useMutation({
    mutationFn: async ({ otp }: OtpForm) => {
      const response = await api.post("/auth/admin/verify-otp", { email, otp });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Invalid OTP");
      }
      return response.data.data;
    },
    onSuccess: (res) => onSuccess(res.accessToken, res.user),
    onError: (e: Error) => toast.error(e.message),
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/auth/admin/resend-otp", { email });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to resend OTP");
      }
      return response.data;
    },
    onSuccess: () => {
      setSeconds(60);
      toast.success("A new verification code has been sent.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Enter verification code</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step 2 of 2 — we sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
      </p>

      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="mt-8 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="otp">One-time passcode</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="••••••"
              className="pl-9 text-center text-lg tracking-[0.5em]"
              {...form.register("otp")}
            />
          </div>
          {form.formState.errors.otp && (
            <p className="text-xs font-medium text-destructive">{form.formState.errors.otp.message}</p>
          )}
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span>
              Code expires in{" "}
              <span className={seconds <= 10 ? "font-semibold text-destructive" : "font-semibold text-foreground"}>
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
              </span>
            </span>
            <button
              type="button"
              disabled={seconds > 0 || resendMutation.isPending}
              onClick={() => resendMutation.mutate()}
              className="font-medium text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
            >
              {resendMutation.isPending ? "Resending..." : "Resend code"}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Verifying…" : "Verify & sign in"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Back
        </Button>
      </form>
    </>
  );
}
