import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Search, Activity, TrendingUp,
  FileText, BookOpen, FileCheck, Filter,
} from "lucide-react";
import { useDashboardActivity } from "@/api/hooks";
import type { ActivityItem } from "@/api/ai-features/dashboard";

// ─── Same icon config as Dashboard ────────────────────────────────────────────
const ICON_STYLE: Record<string, { Icon: React.ElementType; bg: string; text: string; label: string }> = {
  prediction: { Icon: TrendingUp, bg: "bg-legal-success/10", text: "text-legal-success", label: "Predictive AI"       },
  document:   { Icon: FileText,   bg: "bg-legal-primary/10", text: "text-legal-primary", label: "Document Summarizer" },
  pdf:        { Icon: FileCheck,  bg: "bg-legal-warning/10", text: "text-legal-warning", label: "PDF Tools"           },
  legal:      { Icon: BookOpen,   bg: "bg-legal-info/10",    text: "text-legal-info",    label: "AI Chat"             },
};

function ActivityRow({ item }: { item: ActivityItem }) {
  const style = ICON_STYLE[item.icon_type] ?? ICON_STYLE.document;
  return (
    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}>
          <style.Icon className={`h-4 w-4 ${style.text}`} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground text-sm">{item.action}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[240px]">
            {item.file}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 ml-4">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground hidden sm:inline">
          {item.tool}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
      </div>
    </div>
  );
}

// ─── Filter pills ──────────────────────────────────────────────────────────────
const FILTERS = [
  { value: "all",        label: "All"               },
  { value: "prediction", label: "Predictive AI"     },
  { value: "document",   label: "Document Summarizer"},
  { value: "pdf",        label: "PDF Tools"          },
  { value: "legal",      label: "AI Chat"            },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
const AllActivity = () => {
  const navigate = useNavigate();
  const [search,      setSearch]      = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const { data, isLoading } = useDashboardActivity();
  const activities = data?.activities ?? [];

  const filtered = useMemo(() => {
    return activities.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.icon_type === activeFilter;
      const matchesSearch =
        !search.trim() ||
        item.action.toLowerCase().includes(search.toLowerCase()) ||
        item.file.toLowerCase().includes(search.toLowerCase()) ||
        item.tool.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [activities, activeFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    for (const item of filtered) {
      const date = new Date(item.timestamp);
      const today     = new Date();
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      let label: string;
      if (date.toDateString() === today.toDateString())     label = "Today";
      else if (date.toDateString() === yesterday.toDateString()) label = "Yesterday";
      else label = date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Activity</h1>
            <p className="text-sm text-muted-foreground">
              Your full history across all LexOrbit tools
            </p>
          </div>
        </div>

        {/* ── Search + filter ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action, file or tool…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeFilter === f.value
                    ? "bg-legal-primary text-white border-legal-primary"
                    : "border-border text-muted-foreground hover:border-legal-primary hover:text-legal-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-muted/40 rounded-lg">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-16 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-foreground">No activity found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || activeFilter !== "all"
                  ? "Try clearing your search or filter."
                  : "Use any AI tool to see your history here."}
              </p>
              {(search || activeFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => { setSearch(""); setActiveFilter("all"); }}
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  {dateLabel}
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <ActivityRow key={String(item.id)} item={item} />
                  ))}
                </div>
              </div>
            ))}

            <p className="text-center text-xs text-muted-foreground pt-2">
              Showing {filtered.length} of {activities.length} activities
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AllActivity;
