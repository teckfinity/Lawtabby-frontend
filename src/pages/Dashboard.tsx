import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain, FileText, Gavel, Network, TrendingUp, FileCheck,
  BarChart3, Clock, Star, BookOpen, ChevronRight, Activity,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDashboardStats, useDashboardActivity } from "@/api/hooks";
import type { ActivityItem } from "@/api/ai-features/dashboard";

// ─── Icon + colour map for activity feed ──────────────────────────────────────
const ICON_STYLE: Record<string, { Icon: React.ElementType; bg: string; text: string }> = {
  prediction: { Icon: TrendingUp, bg: "bg-legal-success/10",  text: "text-legal-success"  },
  document:   { Icon: FileText,   bg: "bg-legal-primary/10",  text: "text-legal-primary"  },
  pdf:        { Icon: FileCheck,  bg: "bg-legal-warning/10",  text: "text-legal-warning"  },
  legal:      { Icon: BookOpen,   bg: "bg-legal-info/10",     text: "text-legal-info"     },
};

function ActivityIcon({ type }: { type: ActivityItem["icon_type"] }) {
  const style = ICON_STYLE[type] ?? ICON_STYLE.document;
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}>
      <style.Icon className={`h-4 w-4 ${style.text}`} />
    </div>
  );
}

// ─── Static config — does NOT change per user ─────────────────────────────────
const QUICK_ACTIONS = [
  {
    title:       "Legal Research",
    description: "AI-powered research with verified U.S. citations",
    Icon:        Brain,
    href:        "/ai/legal-research",
    color:       "bg-primary",
    badge:       "New",
  },
  {
    title:       "Document Summarizer",
    description: "Convert long legal cases into concise summaries",
    Icon:        FileText,
    href:        "/ai/summarizer",
    color:       "bg-primary",
    badge:       "AI Powered",
  },
  {
    title:       "PDF Tools",
    description: "Merge, split, compress, and edit PDFs",
    Icon:        FileCheck,
    href:        "/pdf-tools",
    color:       "bg-navy",
    badge:       "Essential",
  },
  {
    title:       "Judge Analytics",
    description: "Insights into judge behavior and ruling patterns",
    Icon:        Gavel,
    href:        "/ai/judge-analytics",
    color:       "bg-navy-light",
    badge:       "Popular",
  },
];

// Featured tools with real navigation destinations
const FEATURED_TOOLS = [
  {
    title:       "Citation Maps",
    description: "Visual case relationships",
    href:        "/ai/citation-maps",
    Icon:        Network,
    highlighted: true,
  },
  {
    title:       "Predictive AI",
    description: "Case outcome predictions",
    href:        "/ai/predictive",
    Icon:        TrendingUp,
    highlighted: false,
  },
  {
    title:       "Document Automation",
    description: "Auto-generate legal docs",
    href:        "/ai/automation",
    Icon:        FileCheck,
    highlighted: false,
  },
  {
    title:       "Judge Analytics",
    description: "Judicial behavior insights",
    href:        "/ai/judge-analytics",
    Icon:        Gavel,
    highlighted: false,
  },
  {
    title:       "Legal Research",
    description: "AI-powered case research",
    href:        "/ai/legal-research",
    Icon:        BookOpen,
    highlighted: false,
  },
];

// ─── Dashboard page ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();

  const { data: stats,    isLoading: statsLoading }    = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();

  // Map real API stats to stat cards (fallback to "—" while loading)
  const statCards = [
    { label: "Documents Processed", value: stats ? stats.documents_processed.toLocaleString() : "—", Icon: FileText  },
    { label: "Hours Saved",         value: stats ? stats.hours_saved.toLocaleString()          : "—", Icon: Clock     },
    { label: "Cases Analyzed",      value: stats ? stats.cases_analyzed.toLocaleString()       : "—", Icon: BarChart3 },
    { label: "Success Rate",        value: stats ? stats.success_rate                          : "—", Icon: TrendingUp },
  ];

  const activities = activity?.activities ?? [];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto w-full">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
            Welcome to LexOrbit
          </h1>
          <p className="text-muted-foreground text-lg font-body">
            Your AI-powered legal assistant for document analysis, case research, and legal automation
          </p>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-7 w-16" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : statCards.map((s) => (
                <Card key={s.label} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-foreground">{s.value}</p>
                        <p className="text-sm text-muted-foreground">{s.label}</p>
                      </div>
                      <s.Icon className="h-8 w-8 text-legal-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* ── Quick Actions ── */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {QUICK_ACTIONS.map((action) => (
              <Card
                key={action.title}
                className="shadow-card hover:shadow-legal transition-all duration-300 group cursor-pointer"
              >
                <Link to={action.href}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <action.Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-xs">{action.badge}</Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-legal-primary transition-colors">
                      {action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{action.description}</CardDescription>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Bottom grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-legal-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest actions across all tools</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-2 h-2 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 4).map((item) => (
                      <div
                        key={String(item.id)}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ActivityIcon type={item.icon_type} />
                          <div>
                            <p className="font-medium text-foreground text-sm">{item.action}</p>
                            <p className="text-xs text-muted-foreground">
                              <span className="truncate max-w-[160px] inline-block align-bottom">{item.file}</span>
                              {item.tool && (
                                <span className="ml-2 text-legal-primary/70">· {item.tool}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2 whitespace-nowrap">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No activity yet.</p>
                    <p className="text-xs mt-1">Use any AI tool to see your history here.</p>
                  </div>
                )}

                {activities.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate("/activity")}
                  >
                    View All Activity
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Featured Tools — fully navigable */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-legal-warning" />
                Featured Tools
              </CardTitle>
              <CardDescription>Most used AI features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {FEATURED_TOOLS.map((tool) => (
                <Link key={tool.title} to={tool.href}>
                  <div
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                      tool.highlighted
                        ? "bg-gradient-primary text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <tool.Icon
                        className={`h-5 w-5 shrink-0 ${
                          tool.highlighted ? "text-white" : "text-legal-primary"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className={`font-medium text-sm ${tool.highlighted ? "text-white" : "text-foreground"}`}>
                          {tool.title}
                        </p>
                        <p className={`text-xs truncate ${tool.highlighted ? "text-white/80" : "text-muted-foreground"}`}>
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 ${tool.highlighted ? "text-white/70" : "text-muted-foreground"}`}
                    />
                  </div>
                </Link>
              ))}

              <Button
                className="w-full bg-legal-primary hover:bg-legal-primary/90 mt-1"
                onClick={() => navigate("/ai/legal-research")}
              >
                Explore All AI Tools
              </Button>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
