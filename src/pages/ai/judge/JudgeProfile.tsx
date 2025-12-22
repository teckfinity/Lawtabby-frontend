import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Gavel,
  TrendingUp,
  TrendingDown,
  Clock,
  Scale,
  BarChart3,
  Calendar,
  Award,
  Users,
  AlertCircle,
  FileText
} from "lucide-react";
import { 
  getJudgeCompleteProfile, 
  getJudgeStats,
  getJudgeCaseDistribution,
  getJudgeInsights,
  getJudgeOldAnalytics,
  getJudgePatterns  // ← Only this new import added
} from "@/api/Ai_Features_Microsrc/judge_analytcs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const JudgeProfile = () => {
  const navigate = useNavigate();
  const { judgeId } = useParams<{ judgeId: string }>();
  const { toast } = useToast();

  const [judgeData, setJudgeData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [patternsData, setPatternsData] = useState<any>(null); // ← New state for patterns
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!judgeId || isNaN(Number(judgeId))) {
      toast({
        variant: "destructive",
        title: "Invalid Judge",
        description: "The judge ID is missing or invalid.",
      });
      navigate("/ai/judges");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);

        const [profileRes, statsRes, distributionRes, insightsRes, oldAnalyticsRes, patternsRes] = await Promise.all([
          getJudgeCompleteProfile(Number(judgeId)),
          getJudgeStats(Number(judgeId)).catch(() => ({ data: { total_cases: 0, grant_rate: 0, avg_decision_days: 0, recent_cases: [] } })),
          getJudgeCaseDistribution(Number(judgeId)).catch(() => ({ data: {} })),
          getJudgeInsights(Number(judgeId)).catch(() => ({ data: { insights: [] } })),
          getJudgeOldAnalytics(Number(judgeId)).catch(() => ({ 
            data: { 
              yearly_activity: [], 
              case_type_breakdown: {} 
            } 
          })),
          getJudgePatterns(Number(judgeId)).catch(() => ({ 
            data: { 
              decision_timing: { avg_decision_days: 0, fast_decisions_pct: 0, slow_decisions_pct: 0 },
              case_type_preferences: {},
              grant_rate_by_type: [],
              behavioral_patterns: []
            } 
          })),
        ]);

        const profileData = profileRes.data;
        const statsData = statsRes.data;
        const distributionData = distributionRes.data;
        const insightsData = insightsRes.data.insights || [];
        const oldAnalyticsData = oldAnalyticsRes.data;
        const patternsDataRes = patternsRes.data;

        // Basic info
        const courts = profileData.statistics?.courts_served || [];
        const courtDisplay = courts.length > 0 ? courts.join(", ") : "N/A";

        const positions = profileData.positions || [];
        const appointedYear = positions.length > 0 ? positions[0].start_year || "N/A" : "N/A";
        const specialty = positions.length > 0 ? positions[0].specialty || "General" : "General";

        const education = profileData.education && profileData.education.length > 0
          ? profileData.education.join(" • ")
          : "N/A";

        // Case Distribution
        const totalCases = statsData.total_cases || 0;
        const caseCategories = Object.keys(distributionData).length > 0
          ? Object.entries(distributionData).map(([category, cases]: [string, any]) => ({
              category,
              cases: Number(cases) || 0,
              percentage: totalCases > 0 ? Math.round((Number(cases) / totalCases) * 100) : 0,
            }))
          : [];

        const grantRate = statsData.grant_rate || 0;
        const trend = grantRate >= 50 ? "up" : "down";

        setJudgeData({
          name: profileData.basic_info.full_name || "Unknown Judge",
          court: courtDisplay,
          appointedYear,
          experience: positions.length > 0 ? `${positions.length} position(s) held` : "N/A",
          specialty,
          bio: profileData.basic_info.biography || "No biography available",
          education,
          totalCases,
          grantRate,
          avgDecisionTime: statsData.avg_decision_days || 0,
          recentCases: statsData.recent_cases?.length || 0,
          caseCategories,
          trend,
        });

        setInsights(insightsData);
        setAnalyticsData(oldAnalyticsData);
        setPatternsData(patternsDataRes); // ← Save patterns data
      } catch (error: any) {
        console.error("Failed to load judge profile:", error);
        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description: "This judge profile could not be loaded.",
        });
        navigate("/ai/judges");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [judgeId, navigate, toast]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading judge profile...</p>
        </div>
      </div>
    );
  }

  if (!judgeData) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center flex-col gap-6">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Judge Profile Not Available</h2>
          <p className="text-muted-foreground mt-2">We couldn't load this judge's information.</p>
        </div>
        <Button onClick={() => navigate("/ai/judge-analytics")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Judge Analytics
        </Button>
      </div>
    );
  }

  // Prepare dynamic data for Analytics tab
  const yearlyActivity = analyticsData?.yearly_activity || [];
  const monthlyStats = yearlyActivity.map((item: any) => ({
    month: item.year.toString(),
    granted: Math.round(item.count * (judgeData.grantRate / 100)) || 0,
    denied: item.count - Math.round(item.count * (judgeData.grantRate / 100)) || 0,
    avgDays: judgeData.avgDecisionTime || 0,
  }));

  const motionData = Object.entries(analyticsData?.case_type_breakdown || {}).map(([name, count]: [string, any]) => ({
    name,
    granted: Math.round((count as number) * (judgeData.grantRate / 100)),
    denied: (count as number) - Math.round((count as number) * (judgeData.grantRate / 100)),
  }));

  const pieColors = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--secondary))", "hsl(var(--accent))"];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/ai/judge-analytics")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Judge Analytics
        </Button>

        {/* Header */}
        <div className="flex gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Gavel className="h-12 w-12 text-white" />
          </div>

          <div className="flex-1 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{judgeData.name}</h1>
              <p className="text-muted-foreground">{judgeData.court}</p>
              <p className="text-sm text-muted-foreground">
                Appointed: {judgeData.appointedYear} • {judgeData.experience}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{judgeData.specialty}</Badge>
                <Badge variant={judgeData.trend === "up" ? "default" : "secondary"}>
                  {judgeData.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {judgeData.trend === "up" ? "Trending Up" : "Trending Down"}
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-legal-primary">
                {judgeData.grantRate}%
              </div>
              <p className="text-sm text-muted-foreground">Grant Rate</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{judgeData.totalCases}</div>
              <p className="text-sm text-muted-foreground">Total Cases</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-legal-warning">{judgeData.grantRate}%</div>
              <p className="text-sm text-muted-foreground">Grant Rate</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-legal-info">
                {judgeData.avgDecisionTime > 0 ? `${judgeData.avgDecisionTime} days` : "N/A"}
              </div>
              <p className="text-sm text-muted-foreground">Avg Decision Time</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-legal-success">{judgeData.recentCases}</div>
              <p className="text-sm text-muted-foreground">Recent Cases</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Background & Education */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-legal-primary" />
                      Background & Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{judgeData.bio}</p>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Award className="h-4 w-4 text-legal-warning" />
                        <span><strong>Education:</strong> {judgeData.education}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-legal-info" />
                        <span><strong>Appointed:</strong> {judgeData.appointedYear}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Scale className="h-4 w-4 text-legal-success" />
                        <span><strong>Specialization:</strong> {judgeData.specialty}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Case Distribution by Category */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-legal-primary" />
                      Case Distribution by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {judgeData.caseCategories.length > 0 ? (
                      <div className="space-y-4">
                        {judgeData.caseCategories.map((cat: any, i: number) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{cat.category}</span>
                              <span className="text-muted-foreground">
                                {cat.cases} cases ({cat.percentage}%)
                              </span>
                            </div>
                            <Progress value={cat.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No case breakdown available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-legal-primary" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {insights.filter((i: any) => i.enabled).length > 0 ? (
                      insights
                        .filter((i: any) => i.enabled)
                        .map((insight: any) => (
                          <div
                            key={insight.id}
                            className="p-3 rounded-lg bg-legal-success/5 border border-legal-success/20"
                          >
                            <div className="flex items-start gap-3">
                              <TrendingUp className="h-5 w-5 text-legal-success mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-medium text-sm">{insight.title}</h4>
                                <p className="text-xs text-muted-foreground">{insight.description}</p>
                                {insight.metric && (
                                  <p className="text-xs font-semibold mt-1 text-legal-success">
                                    {insight.metric}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        No active insights for this judge.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" onClick={() => navigate(`/ai/judge/${judgeId}/case-history`)}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Case History
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/ai/judge/${judgeId}/predictions`)}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Get Predictions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab - ONLY THIS PART IS UPDATED (dynamic + same design) */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Grant vs Denied by Year</CardTitle>
                  <CardDescription>Track decision patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    {monthlyStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="granted" stackId="a" fill="hsl(var(--primary))" />
                          <Bar dataKey="denied" stackId="a" fill="hsl(var(--destructive))" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground pt-24">No yearly activity data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Avg Decision Time (days)</CardTitle>
                  <CardDescription>Average time to decision per year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    {monthlyStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="avgDays" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground pt-24">No decision time data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Motions by Grant Rate</CardTitle>
                  <CardDescription>Distribution of outcomes by motion type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64">
                      {motionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={motionData} dataKey="granted" nameKey="name" outerRadius={90} label>
                              {motionData.map((_: any, i: number) => (
                                <Cell key={i} fill={pieColors[i % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground pt-20">No motion data available</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      {motionData.length > 0 ? (
                        motionData.map((m: any) => (
                          <div key={m.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                            <div>
                              <p className="font-medium text-sm">{m.name}</p>
                              <p className="text-xs text-muted-foreground">{m.granted} granted • {m.denied} denied</p>
                            </div>
                            <Badge variant="outline">
                              {m.granted + m.denied > 0 ? Math.round((m.granted / (m.granted + m.denied)) * 100) : 0}%
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No motion breakdown available</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ONLY THIS TAB IS CHANGED — NOW FULLY DYNAMIC */}
          <TabsContent value="patterns" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Decision Timing */}
              <Card className="shadow-card lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-legal-primary" />
                    Decision Timing
                  </CardTitle>
                  <CardDescription>Average speed of rulings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-legal-primary">
                      {patternsData?.decision_timing?.avg_decision_days ?? 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Average Days to Decision</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Fast Decisions (&lt;30 days)</span>
                      <Badge variant="outline">
                        {patternsData?.decision_timing?.fast_decisions_pct ?? 0}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Slow Decisions (&gt;180 days)</span>
                      <Badge variant="outline">
                        {patternsData?.decision_timing?.slow_decisions_pct ?? 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Behavioral Patterns */}
              <Card className="shadow-card lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-legal-primary" />
                    Behavioral Patterns
                  </CardTitle>
                  <CardDescription>AI-detected decision tendencies</CardDescription>
                </CardHeader>
                <CardContent>
                  {patternsData?.behavioral_patterns?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patternsData.behavioral_patterns.map((pattern: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{pattern.pattern}</h4>
                            <Badge variant={pattern.strength === "High" ? "default" : "secondary"}>
                              {pattern.strength}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{pattern.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No significant behavioral patterns detected yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Grant Rate by Case Type */}
              <Card className="shadow-card lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-legal-primary" />
                    Grant Rate by Case Type
                  </CardTitle>
                  <CardDescription>Historical grant rates across different case categories</CardDescription>
                </CardHeader>
                <CardContent>
                  {patternsData?.grant_rate_by_type?.length > 0 ? (
                    <div className="space-y-4">
                      {patternsData.grant_rate_by_type.map((item: any, i: number) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.case_type}</span>
                            <span className="text-muted-foreground">
                              {item.grant_rate}% ({item.total_cases} cases)
                            </span>
                          </div>
                          <Progress value={item.grant_rate} className="h-3" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No grant rate data available by case type.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Toggle insights to include in your analysis report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.length > 0 ? (
                  insights.map((insight: any) => (
                    <div
                      key={insight.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-1 pr-6">
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="h-5 w-5 text-legal-primary" />
                          <h4 className="font-medium text-foreground">{insight.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        {insight.metric && (
                          <p className="text-sm font-semibold mt-2 text-legal-primary">
                            {insight.metric}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={insight.enabled}
                        onCheckedChange={(checked) => {
                          setInsights(prev =>
                            prev.map(i => i.id === insight.id ? { ...i, enabled: checked } : i)
                          );
                          toast({
                            title: checked ? "Insight Added" : "Insight Removed",
                            description: `"${insight.title}" has been ${checked ? "added to" : "removed from"} your report.`,
                          });
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No insights available for this judge.</p>
                  </div>
                )}

                {insights.length > 0 && (
                  <div className="pt-4 border-t">
                    <Button
                      className="w-full"
                      onClick={() => {
                        const selected = insights.filter((i: any) => i.enabled);
                        toast({
                          title: "Report Updated",
                          description: `${selected.length} insight(s) included in your analysis.`,
                        });
                      }}
                    >
                      Apply Selected Insights to Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JudgeProfile;