import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  FileText,
  Users,
  AlertCircle
} from "lucide-react";
import {
  BarChart as RBarChart,
  Bar,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend as RLegend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";
import { getJudgeCompleteProfile } from "@/api/Ai_Features_Microsrc/judge_analytcs";

const JudgeProfile = () => {
  const navigate = useNavigate();
  const { judgeId } = useParams();
  const { toast } = useToast();

  const [judgeData, setJudgeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const motionOptions = ["Summary Judgment", "Motion to Dismiss", "Preliminary Injunction"] as const;
  const [selectedMotion, setSelectedMotion] = useState<typeof motionOptions[number]>("Summary Judgment");
  const [appliedInsight, setAppliedInsight] = useState<Record<string, boolean>>({});
  const [selectedTime, setSelectedTime] = useState<{ day: string; slot: string } | null>(null);

  useEffect(() => {
    if (!judgeId) return;

    setLoading(true);
    getJudgeCompleteProfile(judgeId)
      .then((res) => {
        const data = res.data;

        // Map API response to the page's state structure
        setJudgeData({
          name: data.basic_info.full_name,
          court: data.statistics.courts_served.length ? data.statistics.courts_served.join(", ") : "N/A",
          appointedYear: data.positions.length ? data.positions[0].start_year : "N/A",
          experience: `${data.positions.length} position(s) held`,
          specialty: data.positions.length ? data.positions[0].specialty || "General" : "General",
          bio: data.basic_info.biography || "No biography available",
          education: data.education.length ? data.education.map((e: any) => e.degree + ", " + e.institution).join("; ") : "N/A",
          totalCases: data.statistics.total_cases || 0,
          grantRate: data.statistics.grant_rate || 0,
          avgDecisionTime: data.statistics.average_decision_days || 0,
          recentCases: data.recent_cases.length || 0,
          // Dynamically generate case categories
          caseCategories: Object.keys(data.case_types_breakdown).length
            ? Object.entries(data.case_types_breakdown).map(([category, count]) => ({
                category,
                cases: count,
                percentage: data.statistics.total_cases ? Math.round((count / data.statistics.total_cases) * 100) : 0
              }))
            : []
        });
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load judge profile",
        });
      })
      .finally(() => setLoading(false));
  }, [judgeId]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground">Loading judge profile...</span>
      </div>
    );
  }

  if (!judgeData) return null;

  /* =======================
     🔹 STATIC SUPPORT DATA
     (Design untouched)
     ======================= */
  const monthlyStats = [
    { month: "Jan", granted: 85, denied: 15, avgDays: 42 },
    { month: "Feb", granted: 78, denied: 22, avgDays: 47 },
    { month: "Mar", granted: 82, denied: 18, avgDays: 44 },
    { month: "Apr", granted: 76, denied: 24, avgDays: 48 },
    { month: "May", granted: 80, denied: 20, avgDays: 46 },
    { month: "Jun", granted: 84, denied: 16, avgDays: 45 }
  ];

  const casesByMotion = [
    { name: "Summary Judgment", granted: 64, denied: 36 },
    { name: "Motion to Dismiss", granted: 58, denied: 42 },
    { name: "Preliminary Injunction", granted: 41, denied: 59 },
  ];

  const keyInsights = [
    {
      title: "High Grant Rate",
      description: "78% grant rate in motion hearings, above average for jurisdiction",
      type: "positive",
      icon: TrendingUp
    },
    {
      title: "Fast Decisions",
      description: "Decisions typically made within 45 days, faster than court average",
      type: "positive",
      icon: Clock
    },
    {
      title: "Corporate Focus",
      description: "Expertise in corporate law matters, favorable to business interests",
      type: "neutral",
      icon: Scale
    },
    {
      title: "Settlement Preference",
      description: "Encourages settlement in 65% of cases before trial",
      type: "neutral",
      icon: Users
    }
  ];

  const rulingPatternsByMotion: Record<string, any[]> = {
    "Summary Judgment": [{ factor: "Strong Evidence", lift: 1.8, sample: "Case A" }],
    "Motion to Dismiss": [{ factor: "Legal Precedent", lift: 1.5, sample: "Case B" }],
    "Preliminary Injunction": [{ factor: "Urgency", lift: 1.2, sample: "Case C" }]
  };

  const timeHeatmap: any[] = [
    { day: "Monday", morning: 0.8, afternoon: 0.6, late: 0.3 },
    { day: "Tuesday", morning: 0.7, afternoon: 0.5, late: 0.4 }
  ];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Judge Analytics
        </Button>

        <div className="flex gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Gavel className="h-12 w-12 text-white" />
          </div>

          <div className="flex-1 flex justify-between">
            <div>
              <h1 className="text-3xl font-bold">{judgeData.name}</h1>
              <p className="text-muted-foreground">{judgeData.court}</p>
              <p className="text-sm text-muted-foreground">
                Appointed: {judgeData.appointedYear} • {judgeData.experience}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{judgeData.specialty}</Badge>
                <Badge>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending Up
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
              <div className="text-2xl font-bold text-legal-info">{judgeData.avgDecisionTime}</div>
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

        {/* Main Content Tabs */}
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
                {/* Biography */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-legal-primary" />
                      Background & Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{judgeData.bio}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-legal-warning" />
                        <span className="text-sm"><strong>Education:</strong> {judgeData.education}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-legal-info" />
                        <span className="text-sm"><strong>Appointed:</strong> {judgeData.appointedYear}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-legal-success" />
                        <span className="text-sm"><strong>Specialization:</strong> {judgeData.specialty}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Case Distribution */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-legal-primary" />
                      Case Distribution by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {judgeData.caseCategories && judgeData.caseCategories.length
                        ? judgeData.caseCategories.map((category: any, index: number) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{category.category}</span>
                                <div className="text-right">
                                  <span className="text-sm font-medium">{category.cases} cases</span>
                                  <span className="text-xs text-muted-foreground ml-2">({category.percentage}%)</span>
                                </div>
                              </div>
                              <Progress value={category.percentage} className="h-2" />
                            </div>
                          ))
                        : <p className="text-sm text-muted-foreground">No case breakdown available.</p>
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Key Insights */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-legal-primary" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {keyInsights.map((insight, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        insight.type === 'positive' ? 'border-legal-success/20 bg-legal-success/5' :
                        insight.type === 'negative' ? 'border-destructive/20 bg-destructive/5' :
                        'border-border bg-muted/30'
                      }`}>
                        <div className="flex items-start gap-3">
                          <insight.icon className={`h-5 w-5 mt-0.5 ${
                            insight.type === 'positive' ? 'text-legal-success' :
                            insight.type === 'negative' ? 'text-destructive' :
                            'text-muted-foreground'
                          }`} />
                          <div>
                            <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                            <p className="text-xs text-muted-foreground">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start"
                      onClick={() => navigate(`/ai/judge/${judgeId}/case-history`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Case History
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate(`/ai/judge/${judgeId}/predictions`)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Get Predictions
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/ai/judges/compare')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Compare Judges
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ================== Analytics, Patterns, Insights Tabs ================== */}
          {/* These remain unchanged from your original code */}
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
                      <RBarChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RTooltip />
                        <RLegend />
                        <Bar dataKey="granted" stackId="a" fill="hsl(var(--primary))" />
                        <Bar dataKey="denied" stackId="a" fill="hsl(var(--destructive))" />
                      </RBarChart>
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
                  <div className="h-72 text-foreground">
                    <ResponsiveContainer width="100%" height="100%">
                      <RLineChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RTooltip />
                        <RLegend />
                        <Line type="monotone" dataKey="avgDays" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                      </RLineChart>
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
                          <Pie data={casesByMotion} dataKey="granted" nameKey="name" outerRadius={90} label>
                            {casesByMotion.map((_, i) => (
                              <Cell key={i} fill={["hsl(var(--primary))","hsl(var(--secondary))","hsl(var(--accent))"][i % 3]} />
                            ))}
                          </Pie>
                          <RTooltip />
                          <RLegend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {casesByMotion.map((m) => (
                        <div key={m.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.granted}% granted • {m.denied}% denied</p>
                          </div>
                          <Badge variant="outline">{m.granted}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Ruling Patterns</CardTitle>
                  <CardDescription>Factors that influence outcomes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="w-full max-w-xs">
                    <Select value={selectedMotion} onValueChange={(v) => setSelectedMotion(v as typeof motionOptions[number])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select motion type" />
                      </SelectTrigger>
                      <SelectContent>
                        {motionOptions.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Factor</TableHead>
                        <TableHead className="w-28">Lift</TableHead>
                        <TableHead>Example</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rulingPatternsByMotion[selectedMotion].map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.factor}</TableCell>
                          <TableCell>{row.lift.toFixed(2)}x</TableCell>
                          <TableCell className="text-muted-foreground">{row.sample}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Time Patterns</CardTitle>
                  <CardDescription>Best windows for favorable outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {timeHeatmap.flatMap((d) => ([
                      { label: `${d.day} morning`, day: d.day, slot: "morning" as const, score: d.morning },
                      { label: `${d.day} afternoon`, day: d.day, slot: "afternoon" as const, score: d.afternoon },
                      { label: `${d.day} late`, day: d.day, slot: "late" as const, score: d.late },
                    ])).sort((a,b)=> b.score - a.score).slice(0,6).map((t) => (
                      <Button key={`${t.day}-${t.slot}`} variant="outline" size="sm" onClick={() => setSelectedTime({ day: t.day, slot: t.slot })}>
                        {t.label} ({Math.round(t.score*100)}%)
                      </Button>
                    ))}
                  </div>
                  {selectedTime ? (
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-sm"><strong>Selected:</strong> {selectedTime.day} {selectedTime.slot}</p>
                      <p className="text-xs text-muted-foreground">Historically higher grant rates during this window for {selectedMotion.toLowerCase()}.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a time window to view details.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>Toggle insights and apply to your report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {keyInsights.map((insight) => (
                  <div key={insight.title} className="flex items-start justify-between p-3 rounded-lg border border-border">
                    <div className="pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <insight.icon className="h-4 w-4 text-legal-info" />
                        <span className="text-sm font-medium">{insight.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                    <Switch checked={!!appliedInsight[insight.title]} onCheckedChange={(v) => setAppliedInsight((prev) => ({ ...prev, [insight.title]: !!v }))} />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button onClick={() => {
                    const count = Object.values(appliedInsight).filter(Boolean).length;
                    toast({ title: "Insights applied", description: `${count} insight(s) added to your report.` });
                  }}>
                    Apply Selected
                  </Button>
                  <Button variant="outline" onClick={() => setAppliedInsight({})}>Reset</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default JudgeProfile;
