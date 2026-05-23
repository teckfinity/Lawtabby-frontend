import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
  Briefcase,
  Handshake,
  Info,
} from "lucide-react";
import { useJudgeProfile } from "@/api/hooks";
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

  const [selectedMotion, setSelectedMotion]     = useState<string>("Preliminary Injunction");
  const [enabledInsights, setEnabledInsights]   = useState<Record<string, boolean>>({});

  const judgeIdNum = judgeId && !isNaN(Number(judgeId)) ? Number(judgeId) : undefined;

  // ── React Query: single call replaces useEffect + useState loading ─────────
  const { data: profileData, isLoading: loading, isError } = useJudgeProfile(judgeIdNum);

  // Invalid ID: redirect immediately
  if (!judgeIdNum) {
    toast({ variant: "destructive", title: "Invalid Judge", description: "The judge ID is missing or invalid." });
    navigate("/ai/judge-analytics");
    return null;
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading judge profile...</p>
        </div>
      </div>
    );
  }

  if (isError || !profileData) {
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

  // Extract data from unified endpoint (dark theme API structure)
  const overview = profileData.overview || {};
  const education = profileData.education || [];
  const analytics = profileData.analytics || {};
  const patterns = profileData.patterns || {}; // { ruling_patterns: { [motion]: { factors: [] } }, time_patterns: [] }
  const rulingPatterns = patterns.ruling_patterns || {};
  const timePatterns = patterns.time_patterns || profileData.best_filing_windows || [];
  const insights = profileData.insights || [];
  const bestFilingWindows = timePatterns;
  const distribution = profileData.distribution || [];
  const rulingMotionKeys = Object.keys(rulingPatterns);
  const effectiveMotion = rulingMotionKeys.includes(selectedMotion) ? selectedMotion : (rulingMotionKeys[0] || "Preliminary Injunction");

  const grantRate = analytics.grant_rate || 0;
  const trend = grantRate >= 50 ? "up" : "down";

  // Education entries for dark-theme style: one line per degree (e.g. "Harvard Law School, J.D. 1995")
  const educationLines = education.length > 0
    ? education
        .map((edu: any) => {
          const school = (edu.school || "").trim();
          const degree = (edu.degree_level || "").trim();
          const year = edu.degree_year != null ? String(edu.degree_year) : "";
          if (!school && !degree && !year) return null;
          if (school && degree && year) return `${school}, ${degree} ${year}`;
          if (school && year) return `${school}, ${year}`;
          if (school && degree) return `${school}, ${degree}`;
          if (degree && year) return `${degree} ${year}`;
          return school || degree || year;
        })
        .filter(Boolean) as string[]
    : [];

  // Case distribution data
  const caseCategories = distribution.map((item: any) => ({
    category: item.category,
    cases: item.cases,
    percentage: parseFloat(item.percentage.replace("%", "")) || 0,
  }));

  // Analytics tab: monthly_stats from API (Grant vs Denied by Month, Avg Decision Time)
  const monthlyStatsFromApi = analytics.monthly_stats || [];
  const monthlyStats = monthlyStatsFromApi.length > 0
    ? monthlyStatsFromApi
    : [
        { month: "Jan", granted: Math.round(5 * (grantRate / 100)), denied: Math.round(5 * (1 - grantRate / 100)), avgDays: analytics.avg_decision_time || 45 },
        { month: "Feb", granted: Math.round(6 * (grantRate / 100)), denied: Math.round(6 * (1 - grantRate / 100)), avgDays: analytics.avg_decision_time || 45 },
        { month: "Mar", granted: Math.round(4 * (grantRate / 100)), denied: Math.round(4 * (1 - grantRate / 100)), avgDays: analytics.avg_decision_time || 45 },
        { month: "Apr", granted: Math.round(7 * (grantRate / 100)), denied: Math.round(7 * (1 - grantRate / 100)), avgDays: analytics.avg_decision_time || 45 },
        { month: "May", granted: Math.round(5 * (grantRate / 100)), denied: Math.round(5 * (1 - grantRate / 100)), avgDays: analytics.avg_decision_time || 45 },
        { month: "Jun", granted: Math.round(6 * (grantRate / 100)), denied: Math.round(6 * (1 - grantRate / 100)), avgDays: analytics.avg_decision_time || 45 },
      ];

  // Motion breakdown from API for Top Motions by Grant Rate pie chart
  const motionData = (analytics.motion_breakdown || []).length > 0
    ? analytics.motion_breakdown
    : caseCategories.map((cat: any) => ({
        name: cat.category,
        granted: Math.round(cat.cases * (grantRate / 100)),
        denied: cat.cases - Math.round(cat.cases * (grantRate / 100)),
        percentage: grantRate,
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
              <h1 className="text-3xl font-bold">{overview.full_name || "Unknown Judge"}</h1>
              <p className="text-muted-foreground">{overview.court || "N/A"}</p>
              <p className="text-sm text-muted-foreground">
                Appointed: {overview.appointed || "N/A"} • Experience: {overview.experience || "N/A"}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{overview.specialty || "General"}</Badge>
                <Badge variant={trend === "up" ? "default" : "secondary"}>
                  {trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {trend === "up" ? "Trending Up" : "Trending Down"}
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-legal-primary">
                {grantRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Grant Rate</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{analytics.total_opinions ?? analytics.total_cases ?? 0}</div>
              <p className="text-sm text-muted-foreground">Total Opinions</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-legal-warning">{grantRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Grant Rate</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-legal-info">
                {analytics.avg_decision_time ? `${analytics.avg_decision_time} days` : "N/A"}
              </div>
              <p className="text-sm text-muted-foreground">Avg Decision Time</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-legal-success">{analytics.cases_handled ?? analytics.recent_cases ?? 0}</div>
              <p className="text-sm text-muted-foreground">Cases Handled</p>
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
                    <p className="text-muted-foreground mb-4">{overview.biography || "No biography available"}</p>
                    <div className="space-y-3 text-sm">
                      {educationLines.length > 0 ? (
                        educationLines.map((line: string, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <Award className="h-4 w-4 text-legal-warning flex-shrink-0" />
                            <span>{line}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-3">
                          <Award className="h-4 w-4 text-legal-warning flex-shrink-0" />
                          <span className="text-muted-foreground">Education not available</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-legal-info flex-shrink-0" />
                        <span><strong>Appointed:</strong> {overview.appointed || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Scale className="h-4 w-4 text-legal-success flex-shrink-0" />
                        <span><strong>Specialization:</strong> {overview.specialty || "General"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Case Distribution by Category – data from GET /api/judges/:id/profile/ (same profile API) */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-legal-primary" />
                      Case Distribution by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {caseCategories.length > 0 ? (
                        caseCategories.map((cat: any, index: number) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{cat.category}</span>
                              <span className="text-muted-foreground">
                                {cat.cases} cases ({cat.percentage}%)
                              </span>
                            </div>
                            <Progress value={cat.percentage} className="h-2" />
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground text-sm py-6">
                          Case distribution data not available yet.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Key Insights for this judge (from profile API) */}
              <div className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-legal-primary" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {insights.length > 0 ? (
                      insights.map((item: any, idx: number) => (
                        <div key={item.id ?? idx} className="p-4 rounded-lg border bg-card">
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No insights available yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Grant vs Denied by Month</CardTitle>
                  <CardDescription>Track decision patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
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
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Avg Decision Time (days)</CardTitle>
                  <CardDescription>Average time to decision per month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
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
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={motionData} dataKey={motionData[0]?.percentage != null ? "percentage" : "granted"} nameKey="name" outerRadius={90} label>
                            {motionData.map((_: any, i: number) => (
                              <Cell key={i} fill={pieColors[i % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {motionData.map((m: any) => (
                        <div key={m.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.granted} granted • {m.denied} denied</p>
                          </div>
                          <Badge variant="outline">
                            {m.granted + m.denied > 0 ? Math.round((m.granted / (m.granted + m.denied)) * 100) : 0}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Patterns Tab – Ruling Patterns (by motion type) + Time Patterns (Best Filing Windows) */}
          <TabsContent value="patterns" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-legal-primary" />
                    Ruling Patterns – Factors that influence outcomes
                  </CardTitle>
                  <CardDescription>Select motion type to view factors</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={effectiveMotion} onValueChange={setSelectedMotion}>
                    <SelectTrigger className="mb-4">
                      <SelectValue placeholder="Select motion type" />
                    </SelectTrigger>
                    <SelectContent>
                      {rulingMotionKeys.map((motion) => (
                        <SelectItem key={motion} value={motion}>{motion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rulingPatterns[effectiveMotion]?.factors?.length > 0 ? (
                    <div className="space-y-4">
                      {rulingPatterns[effectiveMotion].factors.map((factor: any, idx: number) => (
                        <div key={idx} className="p-5 rounded-xl border bg-card hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-foreground">{factor.factor}</h4>
                            <Badge variant="default" className="text-sm">{factor.lift}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{factor.example}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No factors for this motion type.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-legal-primary" />
                    Time Patterns – Best windows for favorable outcomes
                  </CardTitle>
                  <CardDescription>Select a time window to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  {timePatterns.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {timePatterns.map((item: any, i: number) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm">
                          {item.window} ({item.percentage}%)
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No time pattern data available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab – AI-Powered Insights with toggles, Apply Selected, Reset */}
          <TabsContent value="insights" className="mt-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>Toggle insights and apply to your report.</CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {insights.map((item: any, i: number) => {
                        const iconName = (item.icon || "").toLowerCase();
                        const IconComponent =
                          iconName === "trending_up" ? TrendingUp
                          : iconName === "trending_down" ? TrendingDown
                          : iconName === "clock" ? Clock
                          : iconName === "briefcase" ? Briefcase
                          : iconName === "handshake" ? Handshake
                          : Info;
                        return (
                          <div key={item.id ?? i} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-legal-primary/10 flex items-center justify-center flex-shrink-0">
                                <IconComponent className="h-5 w-5 text-legal-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={enabledInsights[item.id] ?? false}
                              onCheckedChange={() => setEnabledInsights((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={() => toast({ title: "Applied", description: `Selected ${Object.values(enabledInsights).filter(Boolean).length} insight(s) for report.` })}>
                        Apply Selected
                      </Button>
                      <Button variant="outline" onClick={() => setEnabledInsights({})}>
                        Reset
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No insights available yet.</p>
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