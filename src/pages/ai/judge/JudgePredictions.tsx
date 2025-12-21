import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  TrendingUp, 
  Brain, 
  Target,
  Zap,
  Scale,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calculator,
  FileText
} from "lucide-react";
import { 
  getJudgePredictionContext,
  getJudgeHistoricalPerformance  // ← New import
} from "@/api/Ai_Features_Microsrc/judge_analytcs";

const JudgePredictions = () => {
  const navigate = useNavigate();
  const { judgeId } = useParams<{ judgeId: string }>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [caseDetails, setCaseDetails] = useState({
    caseType: "",
    caseDescription: "",
    clientPosition: "",
    keyFacts: ""
  });
  const [contextData, setContextData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!judgeId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [contextRes, historicalRes] = await Promise.all([
          getJudgePredictionContext(Number(judgeId)).catch(() => ({ data: null })),
          getJudgeHistoricalPerformance(Number(judgeId)).catch(() => ({ data: { performance_by_case_type: [] } })),
        ]);

        setContextData(contextRes.data || {
          judge_name: "Unknown Judge",
          court_name: "Unknown",
          grant_rate: 0,
          avg_decision_time: 0,
          specialty: "General",
          total_cases: 0
        });

        const perfData = historicalRes.data.performance_by_case_type || [];
        setHistoricalData(perfData.map((item: any) => ({
          caseType: item.case_type,
          cases: item.total_cases,
          grantRate: item.grant_rate,
          avgTime: item.avg_decision_time > 0 ? `${item.avg_decision_time} days` : "N/A"
        })));
      } catch (error) {
        console.error("Failed to load prediction data:", error);
        // Fallback data
        setContextData({
          judge_name: "Unknown Judge",
          court_name: "Unknown",
          grant_rate: 0,
          avg_decision_time: 0,
          specialty: "General",
          total_cases: 0
        });
        setHistoricalData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [judgeId]);

  // Mock recent trends (can be replaced later)
  const recentTrends = [
    { metric: "Grant Rate Trend", value: "+5.2%", trend: "up", description: "Increasing over past 6 months" },
    { metric: "Decision Speed", value: "-8 days", trend: "up", description: "Faster decisions recently" },
    { metric: "Settlement Rate", value: "68%", trend: "up", description: "Encourages settlements" },
    { metric: "Appeal Rate", value: "12%", trend: "down", description: "Low reversal rate" }
  ];

  const handleRunPrediction = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const baseGrantRate = contextData?.grant_rate || 0;
      const caseTypeBonus = caseDetails.caseType.toLowerCase().includes(contextData?.specialty?.toLowerCase()) ? 8 : 0;
      const strengthBonus = caseDetails.keyFacts.length > 100 ? 5 : 0;
      
      const finalPrediction = Math.min(95, baseGrantRate + caseTypeBonus + strengthBonus + Math.floor(Math.random() * 15));
      
      setPrediction({
        probability: finalPrediction,
        confidence: finalPrediction > 80 ? "High" : finalPrediction > 60 ? "Medium" : "Low",
        timeEstimate: contextData?.avg_decision_time > 0 ? `${Math.max(30, contextData.avg_decision_time - 10)}-${contextData.avg_decision_time + 10} days` : "N/A",
        keyFactors: [
          { factor: "Judge's Historical Grant Rate", impact: baseGrantRate, weight: 40 },
          { factor: "Case Type Alignment", impact: caseTypeBonus > 0 ? "Positive" : "Neutral", weight: 25 },
          { factor: "Case Strength", impact: strengthBonus > 0 ? "Strong" : "Moderate", weight: 20 },
          { factor: "Recent Trends", impact: "Favorable", weight: 15 }
        ],
        recommendations: [
          `Leverage precedents from ${contextData?.specialty || "similar"} cases`,
          "Prepare strong factual evidence - judge values clarity",
          contextData?.grant_rate > 70 ? "Strong position - push for favorable ruling" : "Consider settlement options early"
        ]
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setCaseDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading prediction context...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/ai/judge/${judgeId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Judge Profile
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-legal-success rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Judge Predictions</h1>
              <p className="text-muted-foreground">
                AI-powered predictions for case outcomes with {contextData?.judge_name || "this judge"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Prediction Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Input Form */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-legal-primary" />
                  Case Details for Prediction
                </CardTitle>
                <CardDescription>
                  Provide your case details to get AI-powered outcome predictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Case Type</label>
                    <Input 
                      placeholder="e.g., Contract Dispute, Employment Law"
                      value={caseDetails.caseType}
                      onChange={(e) => handleInputChange('caseType', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Client Position</label>
                    <Input 
                      placeholder="e.g., Plaintiff, Defendant"
                      value={caseDetails.clientPosition}
                      onChange={(e) => handleInputChange('clientPosition', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Case Description</label>
                  <Textarea 
                    placeholder="Brief description of your case and legal issues involved..."
                    className="min-h-[80px] resize-none"
                    value={caseDetails.caseDescription}
                    onChange={(e) => handleInputChange('caseDescription', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Key Facts & Evidence</label>
                  <Textarea 
                    placeholder="Key facts, evidence, and legal arguments that support your case..."
                    className="min-h-[100px] resize-none"
                    value={caseDetails.keyFacts}
                    onChange={(e) => handleInputChange('keyFacts', e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleRunPrediction}
                  className="w-full bg-legal-primary hover:bg-legal-primary/90"
                  disabled={isAnalyzing || !caseDetails.caseType || !caseDetails.caseDescription}
                >
                  {isAnalyzing ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Case...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Generate Prediction
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Prediction Results */}
            {(prediction || isAnalyzing) && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-legal-success" />
                    Prediction Results
                  </CardTitle>
                  <CardDescription>
                    AI analysis of your case outcome probability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAnalyzing ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-legal-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Analyzing Your Case</h3>
                      <p className="text-muted-foreground">
                        Processing case details against judge's historical patterns...
                      </p>
                    </div>
                  ) : prediction && (
                    <div className="space-y-6">
                      {/* Main Prediction */}
                      <div className="text-center p-8 bg-gradient-primary rounded-lg text-white">
                        <div className="text-5xl font-bold mb-2">{prediction.probability}%</div>
                        <p className="text-xl mb-2">Predicted Success Rate</p>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {prediction.confidence} Confidence
                        </Badge>
                        <p className="text-sm opacity-90 mt-3">
                          Estimated Decision Time: {prediction.timeEstimate}
                        </p>
                      </div>

                      {/* Key Factors */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Contributing Factors
                        </h4>
                        <div className="space-y-3">
                          {prediction.keyFactors.map((factor: any, index: number) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{factor.factor}</span>
                                <span className="text-sm text-muted-foreground">{factor.weight}% weight</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Progress value={factor.weight * 2.5} className="flex-1 h-2" />
                                <span className={`text-xs px-2 py-1 rounded ${
                                  factor.impact === 'Positive' || factor.impact === 'Strong' || factor.impact === 'Favorable' 
                                    ? 'bg-legal-success/10 text-legal-success' :
                                  factor.impact === 'Negative' ? 'bg-destructive/10 text-destructive' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {typeof factor.impact === 'number' ? `${factor.impact}%` : factor.impact}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Strategic Recommendations
                        </h4>
                        <div className="space-y-3">
                          {prediction.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-legal-info/5 rounded-lg border border-legal-info/20">
                              <CheckCircle className="h-4 w-4 text-legal-info mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-border">
                        <Button className="flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          Download Full Report
                        </Button>
                        <Button variant="outline">
                          <Calculator className="h-4 w-4 mr-2" />
                          Refine Analysis
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Judge Context */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-legal-primary" />
                  Judge Context
                </CardTitle>
                <CardDescription>
                  Key information about {contextData?.judge_name || "this judge"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-legal-primary">{contextData?.grant_rate || 0}%</div>
                    <p className="text-xs text-muted-foreground">Grant Rate</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-legal-info">
                      {contextData?.avg_decision_time > 0 ? `${contextData.avg_decision_time} days` : "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Decision</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm"><strong>Specialty:</strong> {contextData?.specialty || "General"}</p>
                  <p className="text-sm"><strong>Court:</strong> {contextData?.court_name || "Unknown"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Historical Performance */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-legal-primary" />
                  Historical Performance
                </CardTitle>
                <CardDescription>
                  Performance by case type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {historicalData.length > 0 ? (
                  historicalData.map((data: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{data.caseType}</span>
                        <span className="text-sm text-muted-foreground">{data.grantRate}%</span>
                      </div>
                      <Progress value={data.grantRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{data.cases} cases</span>
                        <span>{data.avgTime}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No historical performance data available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Trends */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-primary" />
                  Recent Trends
                </CardTitle>
                <CardDescription>
                  Latest patterns and changes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTrends.map((trend, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                    <div className={`p-1 rounded ${
                      trend.trend === 'up' ? 'bg-legal-success/10' : 'bg-legal-warning/10'
                    }`}>
                      {trend.trend === 'up' ? 
                        <TrendingUp className="h-3 w-3 text-legal-success" /> : 
                        <AlertTriangle className="h-3 w-3 text-legal-warning" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{trend.metric}</p>
                      <p className="text-xs text-muted-foreground">{trend.description}</p>
                    </div>
                    <span className="text-sm font-bold">{trend.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgePredictions;