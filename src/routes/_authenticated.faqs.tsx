import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { api } from "@/config/axios.config";
import type { Faq } from "@/lib/mock/types";
import { DataGrid, type GridColumn } from "@/components/admin/DataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/faqs")({
  component: FaqsPage,
});

const schema = z.object({
  question: z.string().trim().min(5, "Question must be at least 5 characters").max(200),
  answer: z.string().trim().min(10, "Answer must be at least 10 characters").max(2000),
  targetRole: z.enum(["seeker", "business", "all"]),
  order: z.coerce.number().int().min(1, "Order must be 1 or higher").max(999),
  isActive: z.boolean(),
});
type FormVals = z.infer<typeof schema>;

function FaqsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Faq> | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/faqs/${id}`);
      return response.data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faqs"] }); toast.success("FAQ deleted"); },
  });

  const columns: GridColumn<Faq>[] = [
    { key: "order", header: "#", sortable: true, width: "60px", cell: (r) => <span className="font-mono text-xs">{r.order}</span> },
    { key: "question", header: "Question", sortable: true, cell: (r) => <div className="min-w-0"><div className="truncate font-medium">{r.question}</div><div className="line-clamp-1 text-xs text-muted-foreground">{r.answer}</div></div> },
    { key: "targetRole", header: "Audience", sortable: true, cell: (r) => <StatusPill tone="info">{r.targetRole}</StatusPill> },
    { key: "isActive", header: "Status", sortable: true, cell: (r) => <StatusPill tone={r.isActive ? "success" : "muted"}>{r.isActive ? "Active" : "Hidden"}</StatusPill> },
    { key: "actions", header: "", width: "1%", cell: (r) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="destructive" onClick={() => del.mutate(r._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">FAQ Deck Manager</h2>
          <p className="text-sm text-muted-foreground">Author, order, and target frequently asked questions.</p>
        </div>
        <Button onClick={() => setEditing({})}><Plus className="mr-1 h-4 w-4" /> New FAQ</Button>
      </div>

      <DataGrid<Faq>
        queryKey={["faqs"]}
        fetchPage={async (p) => {
          const response = await api.get("/admin/faqs", { params: p });
          return response.data.data;
        }}
        columns={columns}
        searchPlaceholder="Search FAQs…"
        initialSort={{ sortBy: "order", sortDir: "asc" }}
        filters={[
          { key: "targetRole", label: "Audience", options: ["seeker","business","all"].map((v) => ({ value: v, label: v })) },
          { key: "isActive", label: "Status", options: [{ value: "true", label: "Active" }, { value: "false", label: "Hidden" }] },
        ]}
      />

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {editing && <FaqForm initial={editing} onClose={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FaqForm({ initial, onClose }: { initial: Partial<Faq>; onClose: () => void }) {
  const qc = useQueryClient();
  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      question: initial.question ?? "",
      answer: initial.answer ?? "",
      targetRole: initial.targetRole ?? "all",
      order: initial.order ?? 1,
      isActive: initial.isActive ?? true,
    },
  });

  const save = useMutation({
    mutationFn: async (v: FormVals) => {
      const response = await api.post("/admin/faqs", { _id: initial._id, ...v });
      return response.data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["faqs"] }); toast.success("FAQ saved"); onClose(); },
  });

  return (
    <>
      <SheetHeader>
        <div className="flex items-start justify-between">
          <SheetTitle>{initial._id ? "Edit FAQ" : "New FAQ"}</SheetTitle>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
      </SheetHeader>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="q">Question</Label>
          <Input id="q" {...form.register("question")} />
          {form.formState.errors.question && <p className="text-xs font-medium text-destructive">{form.formState.errors.question.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a">Answer</Label>
          <Textarea id="a" rows={6} {...form.register("answer")} />
          {form.formState.errors.answer && <p className="text-xs font-medium text-destructive">{form.formState.errors.answer.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={form.watch("targetRole")} onValueChange={(v) => form.setValue("targetRole", v as FormVals["targetRole"], { shouldValidate: true })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["seeker","business","all"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="order">Display order</Label>
            <Input id="order" type="number" min={1} {...form.register("order")} />
            {form.formState.errors.order && <p className="text-xs font-medium text-destructive">{form.formState.errors.order.message}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label className="text-sm">Active</Label>
            <p className="text-xs text-muted-foreground">Visible to end users.</p>
          </div>
          <Switch checked={form.watch("isActive")} onCheckedChange={(v) => form.setValue("isActive", v)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save FAQ"}</Button>
        </div>
      </form>
    </>
  );
}
