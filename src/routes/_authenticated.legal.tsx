import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Scale,
  FileText,
  Save,
  Loader2,
  RefreshCw,
  Eye,
  Edit3,
  HelpCircle,
} from "lucide-react";

import { api } from "@/config/axios.config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/legal")({
  component: LegalSettingsPage,
});

interface LegalSettingsResponse {
  _id: string;
  privacyPolicy: string;
  termsOfService: string;
  updatedAt?: string;
}

function LegalSettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">("privacy");
  const [privacyText, setPrivacyText] = useState("");
  const [termsText, setTermsText] = useState("");
  const [previewMode, setPreviewMode] = useState<"split" | "edit" | "preview">("split");

  const { data, isLoading, refetch } = useQuery<LegalSettingsResponse>({
    queryKey: ["legalSettings"],
    queryFn: async () => {
      const response = await api.get("/admin/legal-settings");
      return response.data.data;
    },
  });

  useEffect(() => {
    if (data) {
      setPrivacyText(data.privacyPolicy || "");
      setTermsText(data.termsOfService || "");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put("/admin/legal-settings", {
        privacyPolicy: privacyText,
        termsOfService: termsText,
      });
      return response.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legalSettings"] });
      toast.success("Legal documents updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update legal settings");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">Loading legal documents...</span>
        </div>
      </div>
    );
  }

  // A very simple regex-based HTML/Markdown preview renderer
  const renderContent = (text: string) => {
    if (!text) return '<p className="text-muted-foreground italic">No content provided.</p>';
    // If it's HTML already, return it directly. Otherwise, do simple markdown conversions
    if (text.trim().startsWith("<")) return text;

    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br />")
      .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
      .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
      .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Legal Policy Editor</h2>
          <p className="text-sm text-muted-foreground">
            Configure dynamic legal documents including Privacy Policy and Terms of Service.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="sm:w-auto"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Publish Legal Docs
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Document Select Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
              activeTab === "privacy"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:bg-accent/40"
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold">Privacy Policy</div>
              <div className="text-[10px] opacity-80 truncate">Manage live privacy policy agreements</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("terms")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
              activeTab === "terms"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:bg-accent/40"
            }`}
          >
            <Scale className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold">Terms of Service</div>
              <div className="text-[10px] opacity-80 truncate">Manage live customer terms & agreements</div>
            </div>
          </button>

          {/* Quick Cheat Sheet */}
          <div className="rounded-lg border border-border bg-card p-4 text-xs space-y-2 shadow-sm text-muted-foreground">
            <h4 className="font-bold flex items-center gap-1 text-foreground">
              <HelpCircle className="h-3.5 w-3.5 text-primary" /> Format Tips
            </h4>
            <p>You can input HTML tags directly to achieve advanced styled layouts (like headers, sections, or bullet lists).</p>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li>Use <code className="bg-muted px-1 rounded">&lt;h2&gt;Section Title&lt;/h2&gt;</code> for page headers.</li>
              <li>Use <code className="bg-muted px-1 rounded">&lt;p&gt;Paragraph&lt;/p&gt;</code> for clean paragraph spacing.</li>
              <li>Use list tags <code className="bg-muted px-1 rounded">&lt;ul&gt;</code> and <code className="bg-muted px-1 rounded">&lt;li&gt;</code> for lists.</li>
            </ul>
          </div>
        </div>

        {/* Workspace Editor + Preview */}
        <div className="lg:col-span-9 space-y-4">
          {/* Controls bar */}
          <div className="flex items-center justify-between border border-border bg-card rounded-lg p-2.5 shadow-sm">
            <div className="text-xs font-bold text-muted-foreground px-2">
              Editing: {activeTab === "privacy" ? "Privacy Policy" : "Terms of Service"}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant={previewMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("edit")}
                className="h-8 text-xs"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <Button
                variant={previewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode("preview")}
                className="h-8 text-xs"
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> Preview
              </Button>
              <Button
                variant={previewMode === "split" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs hidden md:flex"
                onClick={() => setPreviewMode("split")}
              >
                Split View
              </Button>
            </div>
          </div>

          {/* Core Panel */}
          <div className="grid gap-4 md:grid-cols-12">
            {/* Text Editor Column */}
            {(previewMode === "edit" || previewMode === "split") && (
              <div className={`${previewMode === "split" ? "md:col-span-6" : "md:col-span-12"}`}>
                <Textarea
                  value={activeTab === "privacy" ? privacyText : termsText}
                  onChange={(e) => {
                    if (activeTab === "privacy") setPrivacyText(e.target.value);
                    else setTermsText(e.target.value);
                  }}
                  placeholder="Enter HTML or text formatted agreements..."
                  className="min-h-[550px] font-mono text-sm leading-relaxed border border-border bg-background focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>
            )}

            {/* Render Preview Column */}
            {(previewMode === "preview" || previewMode === "split") && (
              <div
                className={`rounded-lg border border-border bg-card p-6 shadow-sm overflow-y-auto max-h-[550px] ${
                  previewMode === "split" ? "md:col-span-6" : "md:col-span-12"
                }`}
              >
                <div
                  className="prose dark:prose-invert max-w-none text-foreground text-sm space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: renderContent(activeTab === "privacy" ? privacyText : termsText),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
