import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
import { getJudgeProfile } from "@/api/Ai_Features_Microsrc/judge_analytcs";
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

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!judgeId || isNaN(Number(judgeId))) {
      toast({
        variant: "destructive",
        title: "Invalid Judge",
        description: "The judge ID is missing or invalid.",
      });
      navigate("/ai/judge-analytics");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getJudgeProfile(Number(judgeId));
        setProfileData(res.data);
      } catch (error: any) {
        console.error("Failed to load judge profile:", error);
        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description: "This judge profile could not be loaded.",
        });
        navigate("/ai/judge-analytics");
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

  if (!profileData) {
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

  // Extract data from unified endpoint
  const overview = profileData.overview || {};
  const education = profileData.education || [];
  const analytics = profileData.analytics || {};
  const patterns = profileData.patterns || [];
  const insights = profileData.insights || [];
  const distribution = profileData.distribution || [];

  const grantRate = analytics.grant_rate || 0;
  const trend = grantRate >= 50 ? "up" : "down";

  // Format education from array
  const formattedEducation = education.length > 0
    ? education
        .map((edu: any) => {
          const degree = edu.degree_level || "";
          const school = edu.school || "";
          const year = edu.degree_year ? ` (${edu.degree_year})` : "";
          return `${degree} from ${school}${year}`.trim();
        })
        .filter(Boolean)
        .join(" • ")
    : "N/A";

  // Case distribution data
  const caseCategories = distribution.map((item: any) => ({
    category: item.category,
    cases: item.cases,
    percentage: parseFloat(item.percentage.replace("%", "")) || 0,
  }));

  // Mock data for Analytics tab (replace later when backend adds yearly data)
  const mockYearly = [
    { year: "2021", count: 4 },
    { year: "2022", count: 7 },
    { year: "2023", count: 5 },
    { year: "2024", count: 4 },
  ];
  const monthlyStats = mockYearly.map((item: any) => ({
    month: item.year,
    granted: Math.round(item.count * (grantRate / 100)),
    denied: item.count - Math.round(item.count * (grantRate / 100)),
    avgDays: analytics.avg_decision_time || 0,
  }));

  const motionData = caseCategories.map((cat: any) => ({
    name: cat.category,
    granted: Math.round(cat.cases * (grantRate / 100)),
    denied: cat.cases - Math.round(cat.cases * (grantRate / 100)),
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
              <div className="text-2xl font-bold text-foreground">{analytics.total_cases || 0}</div>
              <p className="text-sm text-muted-foreground">Total Cases</p>
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
              <div className="text-2xl font-bold text-legal-success">{analytics.recent_cases || 0}</div>
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
                    <p className="text-muted-foreground mb-4">{overview.biography || "No biography available"}</p>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Award className="h-4 w-4 text-legal-warning" />
                        <span><strong>Education:</strong> {formattedEducation}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-legal-info" />
                        <span><strong>Appointed:</strong> {overview.appointed || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Scale className="h-4 w-4 text-legal-success" />
                        <span><strong>Specialization:</strong> {overview.specialty || "General"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Case Distribution by Category - Design preserved even with no data */}
{/* Case Distribution by Category - Fixed 4 slots, always consistent height */}
<Card className="shadow-card">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <BarChart3 className="h-5 w-5 text-legal-primary" />
      Case Distribution by Category
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Always show exactly 4 rows */}
      {[...Array(4)].map((_, index) => {
        const cat = caseCategories[index]; // Real data if exists
        const hasData = !!cat;

        return (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={`font-medium ${hasData ? "" : "text-muted-foreground/70"}`}>
                {hasData ? cat.category : "—"}
              </span>
              <span className="text-muted-foreground">
                {hasData ? `${cat.cases} cases (${cat.percentage}%)` : "—"}
              </span>
            </div>
            <Progress 
              value={hasData ? cat.percentage : 0} 
              className="h-2"
            >
              {hasData ? null : (
                <div className="h-full w-full bg-muted/40 rounded-full" />
              )}
            </Progress>
          </div>
        );
      })}

      {/* Optional message only when no data at all */}
      {caseCategories.length === 0 && (
        <p className="text-center text-muted-foreground text-sm pt-2">
          Case distribution data not available yet.
        </p>
      )}
    </div>
  </CardContent>
</Card>
</div>

              {/* Right Sidebar - Best Filing Windows */}
              <div className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-legal-primary" />
                      Best Filing Windows
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {insights.length > 0 ? (
                      insights.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-legal-primary/10 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-legal-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{item.window}</p>
                              <p className="text-sm text-muted-foreground">Higher grant likelihood</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-legal-success">{item.percentage}%</p>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No timing insights available.
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
                  <CardTitle>Grant vs Denied by Year</CardTitle>
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
                  <CardDescription>Average time to decision per year</CardDescription>
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
                          <Pie data={motionData} dataKey="granted" nameKey="name" outerRadius={90} label>
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

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="mt-6">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-legal-primary" />
                    Decision Patterns & Behavioral Factors
                  </CardTitle>
                  <CardDescription>Factors that significantly influence outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  {patterns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {patterns.map((pattern: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-5 rounded-xl border bg-card hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-foreground">{pattern.factor}</h4>
                            <Badge variant="default" className="text-sm">
                              {pattern.lift}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{pattern.example}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">
                      No significant decision patterns detected yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="mt-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Best Filing Windows</CardTitle>
                <CardDescription>Higher success rates during these time windows</CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-legal-primary/10 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-legal-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.window}</p>
                            <p className="text-sm text-muted-foreground">Higher grant likelihood</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-legal-success">{item.percentage}%</p>
                          <p className="text-xs text-muted-foreground">Success Rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    No timing insights available.
                  </p>
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