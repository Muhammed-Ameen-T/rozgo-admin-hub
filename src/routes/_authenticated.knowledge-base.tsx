import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X, Image as ImageIcon, Video } from "lucide-react";

import { api } from "@/config/axios.config";
import type { KnowledgeArticle } from "@/lib/mock/types";
import { DataGrid, type GridColumn } from "@/components/admin/DataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/knowledge-base")({
  component: KbPage,
});

const schema = z.object({
  title: z.string().trim().min(3, "Title is required").max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/i, "Lowercase letters, numbers, dashes only").min(3).max(80),
  guideType: z.string().trim().min(1),
  content: z.string().trim().min(20, "Content must be at least 20 characters"),
  isPublished: z.boolean(),
  mediaUrls: z.string().optional(),
});
type FormVals = z.infer<typeof schema>;

function KbPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<KnowledgeArticle> | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/knowledge-base/${id}`);
      return response.data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb"] }); toast.success("Article deleted"); },
  });

  const columns: GridColumn<KnowledgeArticle>[] = [
    { key: "title", header: "Title", sortable: true, cell: (r) => <div className="min-w-0"><div className="truncate font-medium">{r.title}</div><div className="truncate text-xs text-muted-foreground">/{r.slug}</div></div> },
    { key: "guideType", header: "Type", sortable: true, cell: (r) => <StatusPill tone="info">{r.guideType}</StatusPill> },
    { key: "mediaAssets", header: "Media", cell: (r) => <span className="text-xs text-muted-foreground">{r.mediaAssets.length} asset(s)</span> },
    { key: "isPublished", header: "Status", sortable: true, cell: (r) => <StatusPill tone={r.isPublished ? "success" : "warning"}>{r.isPublished ? "Published" : "Draft"}</StatusPill> },
    { key: "updatedAt", header: "Updated", sortable: true, cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.updatedAt).toLocaleDateString()}</span> },
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
          <h2 className="text-xl font-semibold text-foreground">Knowledge Base Workspace</h2>
          <p className="text-sm text-muted-foreground">Author rich help-center articles with media assets.</p>
        </div>
        <Button onClick={() => setEditing({})}><Plus className="mr-1 h-4 w-4" /> New article</Button>
      </div>

      <DataGrid<KnowledgeArticle>
        queryKey={["kb"]}
        fetchPage={async (p) => {
          const response = await api.get("/admin/knowledge-base", { params: p });
          return response.data.data;
        }}
        columns={columns}
        searchPlaceholder="Search articles…"
        initialSort={{ sortBy: "updatedAt", sortDir: "desc" }}
        filters={[
          { key: "guideType", label: "Type", options: ["Onboarding","Hiring","Security","Billing"].map((v) => ({ value: v, label: v })) },
          { key: "isPublished", label: "Status", options: [{ value: "true", label: "Published" }, { value: "false", label: "Draft" }] },
        ]}
      />

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {editing && <KbForm initial={editing} onClose={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KbForm({ initial, onClose }: { initial: Partial<KnowledgeArticle>; onClose: () => void }) {
  const qc = useQueryClient();
  const form = useForm<FormVals>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      title: initial.title ?? "",
      slug: initial.slug ?? "",
      guideType: initial.guideType ?? "Onboarding",
      content: initial.content ?? "",
      isPublished: initial.isPublished ?? false,
      mediaUrls: (initial.mediaAssets ?? []).map((m) => `${m.type}:${m.url}`).join("\n"),
    },
  });

  const save = useMutation({
    mutationFn: async (v: FormVals) => {
      const mediaAssets = (v.mediaUrls ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [t, ...rest] = line.split(":");
          const type = t === "video" ? "video" : "image";
          return { type: type as "image" | "video", url: rest.join(":") };
        });
      const response = await api.post("/admin/knowledge-base", { _id: initial._id, ...v, mediaAssets });
      return response.data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb"] }); toast.success("Article saved"); onClose(); },
  });

  return (
    <>
      <SheetHeader>
        <div className="flex items-start justify-between">
          <SheetTitle>{initial._id ? "Edit article" : "New article"}</SheetTitle>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
      </SheetHeader>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="mt-6 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-xs font-medium text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...form.register("slug")} />
            {form.formState.errors.slug && <p className="text-xs font-medium text-destructive">{form.formState.errors.slug.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Guide type</Label>
          <Select value={form.watch("guideType")} onValueChange={(v) => form.setValue("guideType", v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Onboarding","Hiring","Security","Billing"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="content">Content (HTML supported)</Label>
          <Textarea id="content" rows={10} className="font-mono text-xs" {...form.register("content")} />
          {form.formState.errors.content && <p className="text-xs font-medium text-destructive">{form.formState.errors.content.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="media">Media assets (one per line, format <code>image:url</code> or <code>video:url</code>)</Label>
          <Textarea id="media" rows={3} className="font-mono text-xs" placeholder="image:https://…&#10;video:https://…" {...form.register("mediaUrls")} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" /> image</span>
            <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" /> video</span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label className="text-sm">Published</Label>
            <p className="text-xs text-muted-foreground">Visible in the public help center.</p>
          </div>
          <Switch checked={form.watch("isPublished")} onCheckedChange={(v) => form.setValue("isPublished", v)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save article"}</Button>
        </div>
      </form>
    </>
  );
}
