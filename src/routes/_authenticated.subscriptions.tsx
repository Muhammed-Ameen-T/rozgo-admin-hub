import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, X, Check } from "lucide-react";

import { api } from "@/config/axios.config";
import type { Subscription, SubscriptionPlan } from "@/lib/mock/types";
import { DataGrid, type GridColumn } from "@/components/admin/DataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/subscriptions")({
  component: SubscriptionsPage,
});

const planSchema = z.object({
  name: z.string().trim().min(2, "Name required").max(50),
  price: z.coerce.number().min(0, "Price must be ≥ 0").max(1_000_000),
  currency: z.string().trim().length(3, "Use a 3-letter code"),
  billingCycle: z.enum(["monthly", "yearly"]),
  isActive: z.boolean(),
  featuresText: z.string().trim().min(1, "At least one feature"),
});
type PlanForm = z.infer<typeof planSchema>;

function SubscriptionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Monetization Suite</h2>
        <p className="text-sm text-muted-foreground">Manage plans and review every active subscription.</p>
      </div>
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subs">Subscriptions ledger</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="mt-4"><PlansTab /></TabsContent>
        <TabsContent value="subs" className="mt-4"><LedgerTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PlansTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<SubscriptionPlan> | null>(null);

  const columns: GridColumn<SubscriptionPlan>[] = [
    { key: "name", header: "Plan", sortable: true, cell: (r) => <div className="font-medium">{r.name}</div> },
    { key: "price", header: "Price", sortable: true, cell: (r) => <span className="font-mono">{r.currency} {r.price.toLocaleString()}</span> },
    { key: "billingCycle", header: "Cycle", sortable: true, cell: (r) => <StatusPill tone="info">{r.billingCycle}</StatusPill> },
    { key: "features", header: "Features", cell: (r) => <span className="text-xs text-muted-foreground">{r.features.length} included</span> },
    { key: "isActive", header: "Status", sortable: true, cell: (r) => <StatusPill tone={r.isActive ? "success" : "muted"}>{r.isActive ? "Active" : "Disabled"}</StatusPill> },
    { key: "actions", header: "", width: "1%", cell: (r) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditing(r); }}><Pencil className="h-3.5 w-3.5" /></Button> },
  ];

  void useQuery; // referenced indirectly through DataGrid

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEditing({})}><Plus className="mr-1 h-4 w-4" /> New plan</Button>
      </div>
      <DataGrid<SubscriptionPlan>
        queryKey={["plans"]}
        fetchPage={async (p) => {
          const response = await api.get("/admin/plans", { params: p });
          return response.data.data;
        }}
        columns={columns}
        searchPlaceholder="Search plans…"
        initialSort={{ sortBy: "price", sortDir: "asc" }}
      />
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {editing && <PlanForm initial={editing} onClose={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["plans"] }); }} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function PlanForm({ initial, onClose }: { initial: Partial<SubscriptionPlan>; onClose: () => void }) {
  const form = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    mode: "onBlur",
    defaultValues: {
      name: initial.name ?? "",
      price: initial.price ?? 0,
      currency: initial.currency ?? "INR",
      billingCycle: initial.billingCycle ?? "monthly",
      isActive: initial.isActive ?? true,
      featuresText: (initial.features ?? []).join("\n"),
    },
  });
  const save = useMutation({
    mutationFn: async (v: PlanForm) => {
      const response = await api.post("/admin/plans", {
        _id: initial._id,
        name: v.name, price: v.price, currency: v.currency.toUpperCase(),
        billingCycle: v.billingCycle, isActive: v.isActive,
        features: v.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      return response.data.data;
    },
    onSuccess: () => { toast.success("Plan saved"); onClose(); },
  });

  return (
    <>
      <SheetHeader>
        <div className="flex items-start justify-between">
          <SheetTitle>{initial._id ? "Edit plan" : "New plan"}</SheetTitle>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
      </SheetHeader>
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Plan name</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && <p className="text-xs font-medium text-destructive">{form.formState.errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" min={0} {...form.register("price")} />
            {form.formState.errors.price && <p className="text-xs font-medium text-destructive">{form.formState.errors.price.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cur">Currency</Label>
            <Input id="cur" maxLength={3} {...form.register("currency")} />
            {form.formState.errors.currency && <p className="text-xs font-medium text-destructive">{form.formState.errors.currency.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Billing cycle</Label>
          <Select value={form.watch("billingCycle")} onValueChange={(v) => form.setValue("billingCycle", v as "monthly" | "yearly", { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="feat">Features (one per line)</Label>
          <Textarea id="feat" rows={5} {...form.register("featuresText")} />
          {form.formState.errors.featuresText && <p className="text-xs font-medium text-destructive">{form.formState.errors.featuresText.message}</p>}
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label className="text-sm">Active</Label>
            <p className="text-xs text-muted-foreground">Show in pricing page.</p>
          </div>
          <Switch checked={form.watch("isActive")} onCheckedChange={(v) => form.setValue("isActive", v)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={save.isPending}><Check className="mr-1 h-4 w-4" />{save.isPending ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </>
  );
}

function LedgerTab() {
  const columns: GridColumn<Subscription>[] = [
    { key: "userName", header: "Customer", sortable: true, cell: (r) => <div className="font-medium">{r.userName}</div> },
    { key: "planName", header: "Plan", sortable: true, cell: (r) => <StatusPill tone="info">{r.planName}</StatusPill> },
    { key: "amount", header: "Amount", sortable: true, cell: (r) => <span className="font-mono">₹ {r.amount.toLocaleString()}</span> },
    { key: "startDate", header: "Started", sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.startDate).toLocaleDateString()}</span> },
    { key: "endDate", header: "Expires", sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.endDate).toLocaleDateString()}</span> },
    { key: "status", header: "Status", sortable: true, cell: (r) => <StatusPill tone={r.status === "active" ? "success" : r.status === "expired" ? "warning" : "danger"}>{r.status}</StatusPill> },
    { key: "transactionId", header: "Txn", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.transactionId}</span> },
  ];
  return (
    <DataGrid<Subscription>
      queryKey={["subscriptions"]}
      fetchPage={async (p) => {
        const response = await api.get("/admin/subscriptions", { params: p });
        return response.data.data;
      }}
      columns={columns}
      searchPlaceholder="Search by user, plan, transaction…"
      initialSort={{ sortBy: "startDate", sortDir: "desc" }}
      filters={[{ key: "status", label: "Status", options: ["active","expired","cancelled"].map((v) => ({ value: v, label: v })) }]}
    />
  );
}
