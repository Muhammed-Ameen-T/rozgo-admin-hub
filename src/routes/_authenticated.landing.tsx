import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Globe,
  Users,
  Building2,
  Briefcase,
  ShieldCheck,
  Star,
  Check,
  Loader2,
  Save,
} from "lucide-react";

import { api } from "@/config/axios.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/landing")({
  component: LandingSettingsPage,
});

interface Feedback {
  _id: string;
  userName: string;
  userRole: "seeker" | "business";
  rating: number;
  experienceType: "seeking" | "hiring" | "general";
  comments: string;
  createdAt: string;
}

interface LandingSettingsResponse {
  settings: {
    seekersCount: number;
    businessesCount: number;
    vacanciesCount: number;
    placementsCount: number;
    featuredFeedbacks: string[];
  };
  feedbacks: Feedback[];
}

function LandingSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<LandingSettingsResponse>({
    queryKey: ["landingSettings"],
    queryFn: async () => {
      const response = await api.get("/admin/landing-settings");
      return response.data.data;
    },
  });

  // Local state for stats overrides
  const [seekers, setSeekers] = useState(2450);
  const [businesses, setBusinesses] = useState(420);
  const [vacancies, setVacancies] = useState(860);
  const [placements, setPlacements] = useState(640);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);

  // Initialize state once data is loaded
  useEffect(() => {
    if (data?.settings) {
      setSeekers(data.settings.seekersCount);
      setBusinesses(data.settings.businessesCount);
      setVacancies(data.settings.vacanciesCount);
      setPlacements(data.settings.placementsCount);
      setSelectedFeedbacks(data.settings.featuredFeedbacks || []);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put("/admin/landing-settings", {
        seekersCount: seekers,
        businessesCount: businesses,
        vacanciesCount: vacancies,
        placementsCount: placements,
        featuredFeedbacks: selectedFeedbacks,
      });
      return response.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landingSettings"] });
      toast.success("Landing page settings updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update landing settings");
    },
  });

  const toggleFeedback = (id: string) => {
    setSelectedFeedbacks((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        toast.warning("You can only feature up to 3 feedbacks on the landing page.");
        return prev;
      }
      return [...prev, id];
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">Loading landing settings...</span>
        </div>
      </div>
    );
  }

  const feedbacks = data?.feedbacks || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Landing Page Configurator</h2>
          <p className="text-sm text-muted-foreground">
            Configure dynamic landing page statistics and select featured customer success reviews.
          </p>
        </div>
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
          Save Settings
        </Button>
      </div>

      {/* Stats Counter Configurations */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold text-foreground mb-4">Platform Stats Counters</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Users className="h-4 w-4 text-primary" /> Verified Seekers
            </Label>
            <Input
              type="number"
              value={seekers}
              onChange={(e) => setSeekers(Number(e.target.value))}
              placeholder="e.g. 2450"
              className="font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Building2 className="h-4 w-4 text-emerald-500" /> Active Businesses
            </Label>
            <Input
              type="number"
              value={businesses}
              onChange={(e) => setBusinesses(Number(e.target.value))}
              placeholder="e.g. 420"
              className="font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Briefcase className="h-4 w-4 text-blue-500" /> Active Vacancies
            </Label>
            <Input
              type="number"
              value={vacancies}
              onChange={(e) => setVacancies(Number(e.target.value))}
              placeholder="e.g. 860"
              className="font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-amber-500" /> Hired Placements
            </Label>
            <Input
              type="number"
              value={placements}
              onChange={(e) => setPlacements(Number(e.target.value))}
              placeholder="e.g. 640"
              className="font-medium"
            />
          </div>
        </div>
      </div>

      {/* Featured Testimonials Configurator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Featured Customer Stories</h3>
            <p className="text-xs text-muted-foreground">
              Select exactly 3 reviews below to display on the public success carousel.
            </p>
          </div>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary select-none">
            {selectedFeedbacks.length} / 3 selected
          </div>
        </div>

        {feedbacks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No customer feedbacks submitted yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {feedbacks.map((f) => {
              const isSelected = selectedFeedbacks.includes(f._id);
              const initials = f.userName
                .split(" ")
                .filter(Boolean)
                .map((s) => s[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={f._id}
                  onClick={() => toggleFeedback(f._id)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer select-none bg-card ${
                    isSelected
                      ? "border-emerald-500 ring-1 ring-emerald-500/30"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  {/* Rating & Action badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(f.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    {isSelected ? (
                      <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Featured
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to select
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground italic leading-relaxed mb-6">
                    "{f.comments}"
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {initials}
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="truncate text-xs font-bold text-foreground">{f.userName}</h4>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {f.userRole === "seeker" ? "Job Seeker" : "Business Owner"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
