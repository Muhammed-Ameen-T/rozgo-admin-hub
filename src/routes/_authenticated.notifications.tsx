import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { api } from "@/lib/mock/api";
import type { Notification } from "@/lib/mock/types";
import { DataGrid, type GridColumn } from "@/components/admin/DataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

const schema = z.object({
  title: z.string().trim().min(3, "Title required").max(120),
  body: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
  recipientType: z.enum(["all", "seekers", "businesses", "specific"]),
  systemType: z.enum(["info", "alert", "promo", "system"]),
  targets: z.string().optional(),
}).refine((v) => v.recipientType !== "specific" || !!v.targets?.trim(), {
  message: "Provide at least one target identifier",
  path: ["targets"],
});
type Form = z.infer<typeof schema>;

const typeTone = { info: "info", alert: "danger", promo: "warning", system: "muted" } as const;

function NotificationsPage() {
  const qc = useQueryClient();
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { title: "", body: "", recipientType: "all", systemType: "info", targets: "" },
  });
  const send = useMutation({
    mutationFn: (v: Form) => api.sendNotification({
      title: v.title, body: v.body, recipientType: v.recipientType, systemType: v.systemType,
      targets: (v.targets ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); toast.success("Notification dispatched"); form.reset(); },
  });

  const columns: GridColumn<Notification>[] = [
    { key: "title", header: "Title", sortable: true, cell: (r) => <div className="min-w-0"><div className="truncate font-medium">{r.title}</div><div className="truncate text-xs text-muted-foreground">{r.body}</div></div> },
    { key: "recipientType", header: "Audience", sortable: true, cell: (r) => <StatusPill tone="info">{r.recipientType}</StatusPill> },
    { key: "systemType", header: "Type", sortable: true, cell: (r) => <StatusPill tone={typeTone[r.systemType]}>{r.systemType}</StatusPill> },
    { key: "sentAt", header: "Sent", sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.sentAt).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Broadcast Control</h2>
        <p className="text-sm text-muted-foreground">Distribute targeted platform notices with strict validation.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={form.handleSubmit((v) => send.mutate(v))} className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm" noValidate>
          <h3 className="text-base font-semibold">Compose broadcast</h3>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-xs font-medium text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" rows={4} {...form.register("body")} />
            {form.formState.errors.body && <p className="text-xs font-medium text-destructive">{form.formState.errors.body.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Recipients</Label>
              <Select value={form.watch("recipientType")} onValueChange={(v) => form.setValue("recipientType", v as Form["recipientType"], { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="seekers">Seekers only</SelectItem>
                  <SelectItem value="businesses">Businesses only</SelectItem>
                  <SelectItem value="specific">Specific users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.watch("systemType")} onValueChange={(v) => form.setValue("systemType", v as Form["systemType"], { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["info","alert","promo","system"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.watch("recipientType") === "specific" && (
            <div className="space-y-1.5">
              <Label htmlFor="targets">Target user IDs (comma-separated)</Label>
              <Input id="targets" placeholder="usr_0001, usr_0002…" {...form.register("targets")} />
              {form.formState.errors.targets && <p className="text-xs font-medium text-destructive">{form.formState.errors.targets.message}</p>}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={send.isPending}>
            <Send className="mr-1 h-4 w-4" /> {send.isPending ? "Sending…" : "Send broadcast"}
          </Button>
        </form>

        <div>
          <DataGrid<Notification>
            queryKey={["notifications"]}
            fetchPage={(p) => api.listNotifications(p)}
            columns={columns}
            searchPlaceholder="Search notifications…"
            initialSort={{ sortBy: "sentAt", sortDir: "desc" }}
            filters={[
              { key: "recipientType", label: "Audience", options: ["all","seekers","businesses","specific"].map((v) => ({ value: v, label: v })) },
              { key: "systemType", label: "Type", options: ["info","alert","promo","system"].map((v) => ({ value: v, label: v })) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
