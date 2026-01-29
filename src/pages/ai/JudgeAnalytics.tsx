import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Gavel,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  Scale,
  BarChart3,
  Users,
} from "lucide-react";
import { 
  getJudgesList, 
  getJudgeAnalyticsSummary,
  getJudgeAnalyticsOverview,
  getCaseTypeAnalysis  // ← NEW IMPORT
} from "@/api/Ai_Features_Microsrc/judge_analytcs";
import { useNavigate } from "react-router-dom";

const JudgeAnalytics = () => {
  const limit = 3;
  const [offset, setOffset] = useState(0);
  const [judges, setJudges] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [caseTypeLoading, setCaseTypeLoading] = useState(true);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);
  // Fixed filter list (was commented out before)
  const allFilters = [
    // "Federal Courts",
    // "State Courts",
    // "Appellate",
    // "District",
    // "Civil",
    // "Criminal",
  ] as const;
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
    judges_analyzed: 0,
    cases_tracked: 0,
    courts_covered: 0,
    success_rate: 0,
  });

  const [overview, setOverview] = useState({
    quick_insights: [] as Array<{ title: string; description: string; metric: string }>,
    ai_prediction_teaser: {
      title: "",
      description: "",
      available_judges: 0,
      accuracy_rate: 0,
      cta_text: "",
    },
  });

  // NEW: Separate state for Case Type Analysis from the new endpoint
  const [caseTypeAnalysis, setCaseTypeAnalysis] = useState<any[]>([]);

  // Fetch Summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const res = await getJudgeAnalyticsSummary();
        setSummary(res.data);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Fetch Overview (Quick Insights + AI Teaser only now)
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setOverviewLoading(true);
        const res = await getJudgeAnalyticsOverview();
        setOverview(res.data);
      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setOverviewLoading(false);
      }
    };
    fetchOverview();
  }, []);

  // NEW: Fetch Case Type Analysis from dedicated endpoint
  useEffect(() => {
    const fetchCaseTypeAnalysis = async () => {
      try {
        setCaseTypeLoading(true);
        const res = await getCaseTypeAnalysis();
        setCaseTypeAnalysis(res.data || []);
      } catch (error) {
        console.error("Error fetching case type analysis:", error);
        setCaseTypeAnalysis([]);
      } finally {
        setCaseTypeLoading(false);
      }
    };
    fetchCaseTypeAnalysis();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setOffset(0);
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch Judges
  useEffect(() => {
    const fetchJudges = async () => {
      try {
        setLoading(true);
        const params: any = { limit, offset };
        if (debouncedQuery) params.search = debouncedQuery;

        const res = await getJudgesList(params);
        const data = res.data;

        setJudges(data.results || []);
        setTotalCount(data.pagination?.total || 0);
        setHasNext(data.pagination?.has_next || false);
        setHasPrevious(data.pagination?.has_previous || false);
      } catch (error) {
        console.error("Error fetching judges:", error);
        setJudges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJudges();
  }, [offset, debouncedQuery]);

  // One-time: backfill Grant Rate / Avg Decision / Case Type for all judges (CourtListener + AI)
  const refreshAnalytics = async () => {
    try {
      setRefreshingAnalytics(true);
      await getJudgesList({ limit: 1, offset: 0, backfill_all: true });
      // Refetch current data so UI updates
      const [summaryRes, overviewRes, caseRes, judgesRes] = await Promise.all([
        getJudgeAnalyticsSummary(),
        getJudgeAnalyticsOverview(),
        getCaseTypeAnalysis({ backfill: true }),
        getJudgesList({ limit, offset, ...(debouncedQuery ? { search: debouncedQuery } : {}) }),
      ]);
      setSummary(summaryRes.data);
      setOverview(overviewRes.data);
      setCaseTypeAnalysis(caseRes.data || []);
      const data = judgesRes.data;
      setJudges(data.results || []);
      setTotalCount(data.pagination?.total || 0);
      setHasNext(data.pagination?.has_next || false);
      setHasPrevious(data.pagination?.has_previous || false);
    } catch (e) {
      console.error("Error refreshing analytics:", e);
    } finally {
      setRefreshingAnalytics(false);
    }
  };

  const stats = [
    { label: "Judges Analyzed", value: summary.judges_analyzed.toLocaleString(), icon: Users },
    { label: "Cases Tracked", value: summary.cases_tracked.toLocaleString(), icon: Scale },
    { label: "Courts Covered", value: summary.courts_covered.toString(), icon: Gavel },
    { label: "Success Rate", value: `${summary.success_rate.toFixed(1)}%`, icon: TrendingUp },
  ];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header & Stats */}
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
            {stats.map((stat, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {summaryLoading ? "..." : stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <stat.icon className="h-6 w-6 text-legal-warning" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-legal-primary" />
              Find Judge Analytics
            </CardTitle>
            <CardDescription>Search for judges by name, court, or specialty area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search judges, courts, or case types..."
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {/* <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-legal-primary text-legal-primary hover:bg-legal-primary/10"
                onClick={refreshAnalytics}
                disabled={refreshingAnalytics}
              >
                {refreshingAnalytics ? "Syncing…" : "Refresh analytics (sync Grant Rate & Avg Decision)"}
              </Button> */}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Judge List - NO LAYOUT SHIFT */}
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
                  {loading ? (
                    <div className="flex items-center justify-center min-h-[200px] py-12">
                      <p className="text-lg text-muted-foreground">Loading judges...</p>
                    </div>
                  ) : judges.length > 0 ? (
                    judges.map((j) => {
                      const trend = j.grant_rate > 50 ? "up" : "down";
                      return (
                        <div
                          key={j.id}
                          className="border border-border rounded-lg p-6 hover:shadow-legal transition-shadow duration-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">{j.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{j.court_name || "N/A"}</p>
                              {j.specialty && <Badge variant="outline" className="mt-1">{j.specialty}</Badge>}
                            </div>
                            {/* <div className="flex items-center gap-2">
                              {trend === "up" ? (
                                <TrendingUp className="h-5 w-5 text-legal-success" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-destructive" />
                              )}
                              <span className="text-sm font-medium">{j.grant_rate}% Grant Rate</span>
                            </div> */}

                            <div className="flex items-center gap-2">
                              {j.grant_rate !== null ? (
                                <>
                                  {j.grant_rate > 50 ? (
                                    <TrendingUp className="h-5 w-5 text-legal-success" />
                                  ) : (
                                    <TrendingDown className="h-5 w-5 text-destructive" />
                                  )}
                                  <span className="text-sm font-medium">{j.grant_rate}% Grant Rate</span>
                                </>
                              ) : (
                                <span className="text-sm font-medium text-muted-foreground">No outcome data</span>
                              )}
                            </div>
                          </div>

                          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-legal-primary">{j.total_cases}</p>
                              <p className="text-xs text-muted-foreground">Total Cases</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-legal-warning">{j.grant_rate}%</p>
                              <p className="text-xs text-muted-foreground">Grant Rate</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-legal-info">{j.avg_decision_time} days</p>
                              <p className="text-xs text-muted-foreground">Avg Decision</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-legal-success">{j.recent_cases_count}</p>
                              <p className="text-xs text-muted-foreground">Recent Cases</p>
                            </div>
                          </div> */}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-primary">{j.total_cases}</p>
                            <p className="text-xs text-muted-foreground">Total Opinions</p>  {/* CHANGED label */}
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-warning">
                              {j.grant_rate !== null ? `${j.grant_rate}%` : 'N/A'}  {/* CHANGED: handle null */}
                            </p>
                            <p className="text-xs text-muted-foreground">Grant Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-info">
                              {j.avg_decision_time !== null ? `${j.avg_decision_time} days` : 'N/A'}  {/* CHANGED: handle null */}
                            </p>
                            <p className="text-xs text-muted-foreground">Avg Decision</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-success">{j.recent_cases_count}</p>
                            <p className="text-xs text-muted-foreground">Cases Handled</p>  {/* CHANGED label */}
                          </div>
                        </div>

                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex flex-wrap gap-2">
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
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center min-h-[200px] py-12">
                      <p className="text-lg text-muted-foreground">No judges found matching your criteria.</p>
                    </div>
                  )}
                </div>

                {totalCount > 0 && (
                  <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground order-2 sm:order-1">
                      {totalCount} judge{totalCount !== 1 ? 's' : ''} total
                    </span>
                    <div className="flex items-center gap-1 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-md border-legal-primary/30 text-legal-primary hover:bg-legal-primary/10"
                        disabled={!hasPrevious || loading}
                        onClick={() => setOffset(0)}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 rounded-md border-legal-primary/30 text-legal-primary hover:bg-legal-primary/10 p-0"
                        disabled={!hasPrevious || loading}
                        onClick={() => setOffset(Math.max(offset - limit, 0))}
                      >
                        ‹
                      </Button>
                      <span className="min-w-[100px] text-center text-sm font-medium text-foreground px-3 py-2 bg-muted/50 rounded-md">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 rounded-md border-legal-primary/30 text-legal-primary hover:bg-legal-primary/10 p-0"
                        disabled={!hasNext || loading}
                        onClick={() => setOffset(offset + limit)}
                      >
                        ›
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-md border-legal-primary/30 text-legal-primary hover:bg-legal-primary/10"
                        disabled={!hasNext || loading}
                        onClick={() => setOffset((totalPages - 1) * limit)}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
{/* Case Type Analysis - Very light pastel colored bars */}
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
      {(caseTypeLoading || caseTypeAnalysis.length === 0) ? (
        <>
          {["Civil Rights", "Contract Disputes", "Employment", "Personal Injury"].map((type, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">{type}</span>
                <span className="text-sm text-muted-foreground">—</span>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-3">
                <div className="bg-muted h-3 rounded-full" style={{ width: "0%" }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No data yet</span>
                <span>No data yet</span>
              </div>
            </div>
          ))}
        </>
      ) : (
        caseTypeAnalysis.map((caseType: any, index: number) => {
          const noOutcomeData = caseType.no_outcome_data || caseType.granted_percentage == null;
          const pastelColors = [
            "bg-blue-300",
            "bg-emerald-300",
            "bg-amber-300",
            "bg-purple-300",
            "bg-pink-300",
            "bg-cyan-300",
            "bg-lime-300",
            "bg-orange-300",
          ];
          const barColor = pastelColors[index % pastelColors.length];

          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{caseType.category}</span>
                <span className="text-sm text-muted-foreground">{caseType.total_cases} cases</span>
              </div>
              <div className="w-full bg-muted/40 rounded-full h-3 overflow-hidden">
                <div
                  className={`${barColor} h-3 rounded-full transition-all duration-700 ease-out shadow-sm`}
                  style={{ width: noOutcomeData ? "0%" : `${caseType.granted_percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {noOutcomeData ? (
                  <span>No outcome data</span>
                ) : (
                  <>
                    <span>{caseType.granted_percentage}% Granted</span>
                    <span>{caseType.denied_percentage}% Denied</span>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  </CardContent>
</Card>

            {/* Quick Insights - UNCHANGED */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-legal-primary" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(overviewLoading || overview.quick_insights.length === 0) ? (
                  <>
                    <div className="p-3 rounded-lg border bg-legal-success/10 border-legal-success/20">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-legal-success" />
                        <span className="text-sm font-medium text-muted-foreground">High Success Rate</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Data not available yet</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-legal-warning/10 border-legal-warning/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-legal-warning" />
                        <span className="text-sm font-medium text-muted-foreground">Decision Speed</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Data not available yet</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-legal-info/10 border-legal-info/20">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-legal-info" />
                        <span className="text-sm font-medium text-muted-foreground">Trending Pattern</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Data not available yet</p>
                    </div>
                  </>
                ) : (
                  overview.quick_insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        index === 0
                          ? "bg-legal-success/10 border-legal-success/20"
                          : index === 1
                          ? "bg-legal-warning/10 border-legal-warning/20"
                          : "bg-legal-info/10 border-legal-info/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {index === 0 ? <TrendingUp className="h-4 w-4 text-legal-success" /> :
                         index === 1 ? <Clock className="h-4 w-4 text-legal-warning" /> :
                                       <BarChart3 className="h-4 w-4 text-legal-info" />}
                        <span className="text-sm font-medium">{insight.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                      {insight.metric && (
                        <p className="text-xs font-medium mt-1">{insight.metric}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* AI Predictions Teaser - UNCHANGED */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {overview.ai_prediction_teaser.title || "AI Predictions"}
                </CardTitle>
                <CardDescription className="text-white/80">
                  {overview.ai_prediction_teaser.description || "Outcome likelihood for your case"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold mb-1">
                    {(overview.ai_prediction_teaser.accuracy_rate || 0).toFixed(1)}%
                  </div>
                  <p className="text-sm opacity-90">Predicted Success Rate</p>
                </div>
                <Button variant="secondary" className="w-full" disabled={overviewLoading}>
                  {overview.ai_prediction_teaser.cta_text || "Get Detailed Prediction"}
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