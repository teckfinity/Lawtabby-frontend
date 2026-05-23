import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Gavel, Search, TrendingUp, TrendingDown, Clock, Scale, BarChart3, Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useJudgesList,
  useJudgeAnalyticsSummary,
  useJudgeAnalyticsOverview,
  useCaseTypeAnalysis,
} from "@/api/hooks";

const LIMIT = 3;

const JudgeAnalytics = () => {
  const navigate   = useNavigate();
  const [query, setQuery]   = useState("");
  const [offset, setOffset] = useState(0);

  // Debounce search — resets to page 1 automatically via key change
  const debouncedQuery = useDebounce(query, 600);

  // ── React Query – all 4 calls in parallel, no manual loading states ───────
  const { data: summary, isLoading: summaryLoading } = useJudgeAnalyticsSummary();
  const { data: overview, isLoading: overviewLoading } = useJudgeAnalyticsOverview();
  const { data: caseTypeAnalysis, isLoading: caseTypeLoading } = useCaseTypeAnalysis();
  const {
    data: judgesData,
    isLoading: judgesLoading,
    isFetching: judgesFetching,
  } = useJudgesList({ limit: LIMIT, offset, search: debouncedQuery || undefined });

  const judges     = judgesData?.results ?? [];
  const totalCount = judgesData?.pagination?.total ?? 0;
  const hasNext    = judgesData?.pagination?.has_next ?? false;
  const hasPrev    = judgesData?.pagination?.has_previous ?? false;
  const totalPages = Math.ceil(totalCount / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  // Reset to page 1 when search changes
  useMemo(() => { setOffset(0); }, [debouncedQuery]); // eslint-disable-line

  const statCards = [
    { label: "Judges Analyzed", value: summary?.judges_analyzed.toLocaleString() ?? "—", Icon: Users },
    { label: "Cases Tracked",   value: summary?.cases_tracked.toLocaleString() ?? "—",   Icon: Scale },
    { label: "Courts Covered",  value: summary?.courts_covered.toString() ?? "—",          Icon: Gavel },
    { label: "Success Rate",    value: summary ? `${summary.success_rate.toFixed(1)}%` : "—", Icon: TrendingUp },
  ];

  const pastelColors = [
    "bg-primary/75", "bg-success/75", "bg-legal-warning/75", "bg-legal-info/75",
    "bg-gold-light/80", "bg-navy/55", "bg-burgundy/50", "bg-sage/70",
  ];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* ── Header & Stats ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-legal-warning rounded-lg">
              <Gavel className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Judge Analytics</h1>
              <p className="text-muted-foreground">
                AI-powered insights into judicial behavior, ruling patterns, and case outcomes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <Card key={s.label} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      {summaryLoading
                        ? <Skeleton className="h-7 w-20 mb-1" />
                        : <p className="text-2xl font-bold text-foreground">{s.value}</p>}
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                    <s.Icon className="h-6 w-6 text-legal-warning" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Search ── */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-legal-primary" />
              Find Judge Analytics
            </CardTitle>
            <CardDescription>Search for judges by name, court, or specialty area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search judges, courts, or case types..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Judge list ── */}
          <div className="lg:col-span-2">
            <Card className="shadow-card h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-legal-primary" />
                  Judge Profiles & Analytics
                </CardTitle>
                <CardDescription>Detailed performance analytics and ruling patterns</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-6">
                  {/* Loading skeleton */}
                  {(judgesLoading && judges.length === 0) ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border border-border rounded-lg p-6 space-y-4">
                        <div className="flex justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="text-center space-y-1">
                              <Skeleton className="h-7 w-12 mx-auto" />
                              <Skeleton className="h-3 w-16 mx-auto" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : judges.length > 0 ? (
                    judges.map((j) => (
                      <div
                        key={j.id}
                        className={`border border-border rounded-lg p-6 hover:shadow-legal transition-shadow duration-200 ${judgesFetching ? "opacity-70" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{j.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{j.court_name || "N/A"}</p>
                            {j.specialty && <Badge variant="outline" className="mt-1">{j.specialty}</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            {j.grant_rate !== null ? (
                              <>
                                {j.grant_rate > 50
                                  ? <TrendingUp className="h-5 w-5 text-legal-success" />
                                  : <TrendingDown className="h-5 w-5 text-destructive" />}
                                <span className="text-sm font-medium">{j.grant_rate}% Grant Rate</span>
                              </>
                            ) : (
                              <span className="text-sm font-medium text-muted-foreground">No outcome data</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-primary">{j.total_cases}</p>
                            <p className="text-xs text-muted-foreground">Total Opinions</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-warning">
                              {j.grant_rate !== null ? `${j.grant_rate}%` : "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">Grant Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-info">
                              {j.avg_decision_time !== null ? `${j.avg_decision_time} days` : "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">Avg Decision</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-success">{j.recent_cases_count}</p>
                            <p className="text-xs text-muted-foreground">Cases Handled</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="bg-legal-primary hover:bg-legal-primary/90"
                            onClick={() => navigate(`/ai/judge/${j.id}`)}
                          >
                            View Full Profile
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/ai/judge/${j.id}/case-history`)}>
                            Case History
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/ai/judge/${j.id}/predictions`)}>
                            Predictions
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center min-h-[200px] py-12">
                      <p className="text-lg text-muted-foreground">No judges found matching your criteria.</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalCount > 0 && (
                  <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground order-2 sm:order-1">
                      {totalCount} judge{totalCount !== 1 ? "s" : ""} total
                    </span>
                    <div className="flex items-center gap-1 order-1 sm:order-2">
                      {[
                        { label: "First", disabled: !hasPrev || judgesFetching, onClick: () => setOffset(0) },
                        { label: "‹", disabled: !hasPrev || judgesFetching, onClick: () => setOffset(Math.max(offset - LIMIT, 0)) },
                        { label: `Page ${currentPage} of ${totalPages}`, disabled: true, isInfo: true },
                        { label: "›", disabled: !hasNext || judgesFetching, onClick: () => setOffset(offset + LIMIT) },
                        { label: "Last", disabled: !hasNext || judgesFetching, onClick: () => setOffset((totalPages - 1) * LIMIT) },
                      ].map((btn, i) =>
                        btn.isInfo ? (
                          <span key={i} className="min-w-[110px] text-center text-sm font-medium text-foreground px-3 py-2 bg-muted/50 rounded-md">
                            {btn.label}
                          </span>
                        ) : (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-md border-legal-primary/30 text-legal-primary hover:bg-legal-primary/10"
                            disabled={btn.disabled}
                            onClick={btn.onClick}
                          >
                            {btn.label}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right panel ── */}
          <div className="space-y-6">

            {/* Case Type Analysis */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-legal-primary" />
                  Case Type Analysis
                </CardTitle>
                <CardDescription>Success rates by case category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseTypeLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-3 w-full rounded-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))
                  ) : (caseTypeAnalysis ?? []).map((ct: any, index: number) => {
                    const noData = ct.no_outcome_data || ct.granted_percentage == null;
                    const barColor = pastelColors[index % pastelColors.length];
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{ct.category}</span>
                          <span className="text-sm text-muted-foreground">{ct.total_cases} cases</span>
                        </div>
                        <div className="w-full bg-muted/40 rounded-full h-3 overflow-hidden">
                          <div
                            className={`${barColor} h-3 rounded-full transition-all duration-700 ease-out shadow-sm`}
                            style={{ width: noData ? "0%" : `${ct.granted_percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          {noData ? (
                            <span>No outcome data</span>
                          ) : (
                            <>
                              <span>{ct.granted_percentage}% Granted</span>
                              <span>{ct.denied_percentage}% Denied</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-legal-primary" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {overviewLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  ))
                ) : (overview?.quick_insights ?? []).length > 0 ? (
                  (overview!.quick_insights).map((insight, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        index === 0 ? "bg-legal-success/10 border-legal-success/20" :
                        index === 1 ? "bg-legal-warning/10 border-legal-warning/20" :
                                      "bg-legal-info/10 border-legal-info/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {index === 0 ? <TrendingUp className="h-4 w-4 text-legal-success" /> :
                         index === 1 ? <Clock className="h-4 w-4 text-legal-warning" /> :
                                       <BarChart3 className="h-4 w-4 text-legal-info" />}
                        <span className="text-sm font-medium">{insight.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                      {insight.metric && <p className="text-xs font-medium mt-1">{insight.metric}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Insights not available yet.</p>
                )}
              </CardContent>
            </Card>

            {/* AI Predictions Teaser */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {overview?.ai_prediction_teaser?.title || "AI Predictions"}
                </CardTitle>
                <CardDescription className="text-white/80">
                  {overview?.ai_prediction_teaser?.description || "Outcome likelihood for your case"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold mb-1">
                    {((overview?.ai_prediction_teaser?.accuracy_rate) ?? 0).toFixed(1)}%
                  </div>
                  <p className="text-sm opacity-90">Predicted Success Rate</p>
                </div>
                <Button variant="secondary" className="w-full" disabled={overviewLoading}>
                  {overview?.ai_prediction_teaser?.cta_text || "Get Detailed Prediction"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgeAnalytics;
