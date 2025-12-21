import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as DateRangeCalendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
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
  getJudgeCompleteProfile, 
  getJudgeAnalyticsSummary,
  getJudgeAnalyticsOverview  // ← New import
} from "@/api/Ai_Features_Microsrc/judge_analytcs";
import { useNavigate } from "react-router-dom";

const JudgeAnalytics = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(3);
  const [totalCount, setTotalCount] = useState(0);

  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const totalPages = Math.ceil(totalCount / pageSize);

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

  // Summary for top cards
  const [summary, setSummary] = useState({
    judges_analyzed: 0,
    cases_tracked: 0,
    courts_covered: 0,
    success_rate: 0,
  });

  // Overview data for right panel
  const [overview, setOverview] = useState({
    case_type_analysis: [] as any[],
    quick_insights: [] as Array<{ title: string; description: string; metric: string }>,
    ai_prediction_teaser: {
      title: "",
      description: "",
      available_judges: 0,
      accuracy_rate: 0,
      cta_text: "",
    },
  });

  // Fetch summary (top stats)
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const res = await getJudgeAnalyticsSummary();
        setSummary(res.data);
      } catch (error) {
        console.error("Error fetching judge analytics summary:", error);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, []);

  // Fetch overview (right panel: case types, insights, AI teaser)
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setOverviewLoading(true);
        const res = await getJudgeAnalyticsOverview();
        setOverview(res.data);
      } catch (error) {
        console.error("Error fetching judge analytics overview:", error);
      } finally {
        setOverviewLoading(false);
      }
    };
    fetchOverview();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 600);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch judges list
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const listRes = await getJudgesList({
          page,
          limit: pageSize,
          search: debouncedQuery || undefined,
        });

        const judgesList = listRes.data.results || [];
        setTotalCount(listRes.data.count || 0);

        if (judgesList.length === 0) {
          setJudges([]);
          return;
        }

        const detailsPromises = judgesList.map((j: any) => getJudgeCompleteProfile(j.id));
        const details = await Promise.all(detailsPromises);
        const fullJudges = judgesList.map((j: any, i: number) => ({
          ...j,
          details: details[i].data,
        }));
        setJudges(fullJudges);
      } catch (error) {
        console.error("Error fetching judges data:", error);
        setJudges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, debouncedQuery, pageSize]);

  const filteredJudges = judges.filter((j) => {
    const d = j.details;
    const name = d.basic_info.full_name || "";
    const court = d.statistics.courts_served?.join(", ") || "";
    const specialty = Object.keys(d.case_types_breakdown || {}).join(", ");

    return debouncedQuery.length
      ? [name, court, specialty].some((f) => f.toLowerCase().includes(debouncedQuery.toLowerCase()))
      : true;
  });

  // Dynamic stats from backend summary endpoint
  const stats = [
    { label: "Judges Analyzed", value: summary.judges_analyzed.toLocaleString(), icon: Users },
    { label: "Cases Tracked", value: summary.cases_tracked.toLocaleString(), icon: Scale },
    { label: "Courts Covered", value: summary.courts_covered.toString(), icon: Gavel },
    { label: "Success Rate", value: `${summary.success_rate.toFixed(1)}%`, icon: TrendingUp },
  ];

  if (loading && judges.length === 0) {
    return <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">Loading...</div>;
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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

          {/* Stats */}
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

        {/* Search and Filters */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-legal-primary" />
              Find Judge Analytics
            </CardTitle>
            <CardDescription>
              Search for judges by name, court, or specialty area
              </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search judges, courts, or case types..."
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Judge Profiles */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-legal-primary" />
                  Judge Profiles & Analytics
                </CardTitle>
                <CardDescription>
                  Detailed performance analytics and ruling patterns
                  </CardDescription>
              </CardHeader>
              <CardContent>
                {loading && <div className="text-center py-8 text-muted-foreground">Loading judges...</div>}
                <div className="space-y-6">
                  {filteredJudges.map((j) => {
                    const d = j.details;
                    const name = d.basic_info.full_name;
                    const court = d.statistics.courts_served?.join(", ") || "N/A";
                    const totalCases = d.statistics.total_cases;
                    const grantRate = d.statistics.grant_rate;
                    const avgDecisionTime = `${d.statistics.average_decision_days} days`;
                    const specialty = Object.keys(d.case_types_breakdown || {}).join(", ") || "General";
                    const trend = grantRate > 50 ? "up" : "down";
                    const recentCases = d.recent_cases?.length || 0;
                    return (
                      <div key={j.id} className="border border-border rounded-lg p-6 hover:shadow-legal transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{name}</h3>
                            <p className="text-sm text-muted-foreground">{court}</p>
                            <Badge variant="outline" className="mt-1">{specialty}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {trend === "up" ? (
                              <TrendingUp className="h-5 w-5 text-legal-success" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-destructive" />
                            )}
                            <span className="text-sm font-medium">{grantRate}% Grant Rate</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-primary">{totalCases}</p>
                            <p className="text-xs text-muted-foreground">Total Cases</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-warning">{grantRate}%</p>
                            <p className="text-xs text-muted-foreground">Grant Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-info">{avgDecisionTime}</p>
                            <p className="text-xs text-muted-foreground">Avg Decision</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-legal-success">{recentCases}</p>
                            <p className="text-xs text-muted-foreground">Recent Cases</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-legal-primary hover:bg-legal-primary/90"
                              onClick={() => navigate(`/ai/judge/${j.id}`)}
                            >
                              View Full Profile
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => window.location.href = `/ai/judge/${j.id}/case-history`}>
                              Case History
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => window.location.href = `/ai/judge/${j.id}/predictions`}>
                              Predictions
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredJudges.length === 0 && !loading && (
                    <p className="text-center text-muted-foreground py-8">No judges found matching your criteria.</p>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex w-full items-center justify-end gap-2 mt-8 pr-32">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(p - 1, 1))}>
                      Previous
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={p === page ? "default" : "outline"}
                        onClick={() => setPage(p)}
                        className="min-w-[36px]"
                      >
                        {p}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(p + 1, totalPages))}>
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analytics Panel (unchanged) */}
          <div className="space-y-6">
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
                  {overview.case_type_analysis.length > 0 ? (
                    overview.case_type_analysis.map((caseType: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{caseType.type}</span>
                          <span className="text-sm text-muted-foreground">{caseType.total} cases</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-legal-success h-2 rounded-full"
                            style={{ width: `${caseType.granted}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{caseType.granted}% Granted</span>
                          <span>{caseType.denied}% Denied</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No case type data available</p>
                  )}
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
                {overview.quick_insights.map((insight, index) => (
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
                ))}
              </CardContent>
            </Card>

            {/* AI Predictions Teaser */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {overview.ai_prediction_teaser.title || "AI Predictions"}
                </CardTitle>
                <CardDescription className="text-white/80">
                  {overview.ai_prediction_teaser.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold mb-1">
                    {overview.ai_prediction_teaser.accuracy_rate.toFixed(1)}%
                  </div>
                  <p className="text-sm opacity-90">Model Accuracy</p>
                </div>
                <Button variant="secondary" className="w-full">
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