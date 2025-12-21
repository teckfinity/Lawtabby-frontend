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
import { 
  getJudgeCompleteProfile, 
  getJudgeStats,
  getJudgeCaseDistribution
} from "@/api/Ai_Features_Microsrc/judge_analytcs";

const JudgeProfile = () => {
  const navigate = useNavigate();
  const { judgeId } = useParams<{ judgeId: string }>();
  const { toast } = useToast();

  const [judgeData, setJudgeData] = useState<any>(null);
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

        // Always fetch these two — they are critical
        const [profileRes, statsRes] = await Promise.all([
          getJudgeCompleteProfile(Number(judgeId)),
          getJudgeStats(Number(judgeId)).catch(err => {
            console.warn("Stats API failed:", err);
            return { data: { total_cases: 0, grant_rate: 0, avg_decision_days: 0, recent_cases: [] } };
          }),
        ]);

        const profileData = profileRes.data;
        const statsData = statsRes.data;

        // Optional: Case distribution — don't break the page if it fails
        let distributionData = {};
        try {
          const distRes = await getJudgeCaseDistribution(Number(judgeId));
          distributionData = distRes.data;
        } catch (err) {
          console.warn("Case distribution API failed (non-critical):", err);
          // distributionData remains {} → will show "No case breakdown"
        }

        // Basic info from profile
        const courts = profileData.statistics?.courts_served || [];
        const courtDisplay = courts.length > 0 ? courts.join(", ") : "N/A";

        const positions = profileData.positions || [];
        const appointedYear = positions.length > 0 ? positions[0].start_year || "N/A" : "N/A";
        const specialty = positions.length > 0 ? positions[0].specialty || "General" : "General";

        const education = profileData.education && profileData.education.length > 0
          ? profileData.education.join(" • ")
          : "N/A";

        // Build case categories from distribution endpoint
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
      } catch (error: any) {
        console.error("Critical error loading judge profile:", error);
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
                    {judgeData.grantRate >= 60 && (
                      <div className="p-3 rounded-lg bg-legal-success/5 border border-legal-success/20">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-legal-success mt-0.5" />
                          <div>
                            <h4 className="font-medium text-sm">High Grant Rate</h4>
                            <p className="text-xs text-muted-foreground">
                              {judgeData.grantRate}% grant rate in motion hearings
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {judgeData.avgDecisionTime > 0 && judgeData.avgDecisionTime <= 45 && (
                      <div className="p-3 rounded-lg bg-legal-success/5 border border-legal-success/20">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-legal-success mt-0.5" />
                          <div>
                            <h4 className="font-medium text-sm">Fast Decisions</h4>
                            <p className="text-xs text-muted-foreground">
                              Decisions typically made within {judgeData.avgDecisionTime} days
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {judgeData.specialty !== "General" && (
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-start gap-3">
                          <Scale className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium text-sm">Specialization</h4>
                            <p className="text-xs text-muted-foreground">
                              Expertise in {judgeData.specialty} matters
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {judgeData.totalCases === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        Limited case history available for detailed insights.
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

          {["analytics", "patterns", "insights"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <Card className="shadow-card">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <p className="capitalize">{tab} section coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default JudgeProfile;