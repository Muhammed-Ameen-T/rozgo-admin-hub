import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, X } from "lucide-react";

import { api } from "@/lib/mock/api";
import type { SupportTicket } from "@/lib/mock/types";
import { DataGrid, type GridColumn } from "@/components/admin/DataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/tickets")({
  component: TicketsPage,
});

const priorityTone = { Low: "muted", Medium: "info", High: "warning", Critical: "danger" } as const;
const statusTone = { Open: "warning", "In Progress": "info", Resolved: "success", Closed: "muted" } as const;

function TicketsPage() {
  const [id, setId] = useState<string | null>(null);

  const columns: GridColumn<SupportTicket>[] = [
    { key: "subject", header: "Subject", sortable: true, cell: (r) => <div className="min-w-0"><div className="truncate font-medium">{r.subject}</div><div className="truncate text-xs text-muted-foreground">{r.userName} · {r.category}</div></div> },
    { key: "priority", header: "Priority", sortable: true, cell: (r) => <StatusPill tone={priorityTone[r.priority]}>{r.priority}</StatusPill> },
    { key: "status", header: "Status", sortable: true, cell: (r) => <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill> },
    { key: "assignedTo", header: "Assigned", cell: (r) => <span className="text-sm">{r.assignedTo ?? "—"}</span> },
    { key: "createdAt", header: "Opened", sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Multi-Turn Support Desk</h2>
        <p className="text-sm text-muted-foreground">Triage, reply, and resolve tickets from a single console.</p>
      </div>

      <DataGrid<SupportTicket>
        queryKey={["tickets"]}
        fetchPage={(p) => api.listTickets(p)}
        columns={columns}
        searchPlaceholder="Search by subject, user, category…"
        initialSort={{ sortBy: "createdAt", sortDir: "desc" }}
        filters={[
          { key: "status", label: "Status", options: ["Open","In Progress","Resolved","Closed"].map((v) => ({ value: v, label: v })) },
          { key: "priority", label: "Priority", options: ["Low","Medium","High","Critical"].map((v) => ({ value: v, label: v })) },
        ]}
        onRowClick={(r) => setId(r._id)}
      />

      <Sheet open={!!id} onOpenChange={(o) => !o && setId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {id && <TicketPanel id={id} onClose={() => setId(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const replySchema = z.object({ body: z.string().trim().min(5, "Reply must be at least 5 characters").max(2000) });
type ReplyForm = z.infer<typeof replySchema>;

function TicketPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: ticket } = useQuery({ queryKey: ["ticket", id], queryFn: () => api.getTicket(id) });

  const update = useMutation({
    mutationFn: (patch: Partial<Pick<SupportTicket, "status" | "priority" | "assignedTo">>) => api.updateTicket(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ticket", id] }); qc.invalidateQueries({ queryKey: ["tickets"] }); toast.success("Ticket updated"); },
  });

  const form = useForm<ReplyForm>({ resolver: zodResolver(replySchema), mode: "onBlur", defaultValues: { body: "" } });
  const reply = useMutation({
    mutationFn: (v: ReplyForm) => api.replyTicket(id, v.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ticket", id] }); form.reset(); toast.success("Reply sent"); },
  });

  if (!ticket) return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <>
      <SheetHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <SheetTitle className="truncate">{ticket.subject}</SheetTitle>
            <SheetDescription>{ticket.userName} · {ticket.category}</SheetDescription>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
      </SheetHeader>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={ticket.status} onValueChange={(v) => update.mutate({ status: v as SupportTicket["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Open","In Progress","Resolved","Closed"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Priority</Label>
          <Select value={ticket.priority} onValueChange={(v) => update.mutate({ priority: v as SupportTicket["priority"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Low","Medium","High","Critical"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Conversation</h4>
        <div className="space-y-3">
          {ticket.messages.map((m) => (
            <div key={m._id} className={m.authorRole === "admin" ? "ml-6" : "mr-6"}>
              <div className={`rounded-lg border p-3 text-sm ${m.authorRole === "admin" ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{m.authorName}</span>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p>{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={form.handleSubmit((v) => reply.mutate(v))} className="mt-6 space-y-2" noValidate>
        <Label htmlFor="reply">Reply as admin</Label>
        <Textarea id="reply" rows={4} placeholder="Type an official response…" {...form.register("body")} />
        {form.formState.errors.body && <p className="text-xs font-medium text-destructive">{form.formState.errors.body.message}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={reply.isPending}>
            <Send className="mr-1 h-3.5 w-3.5" /> Send reply
          </Button>
        </div>
      </form>
    </>
  );
}
