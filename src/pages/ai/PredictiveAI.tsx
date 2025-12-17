import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Search, 
  Brain,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Calculator,
  Scale,
  Clock
} from "lucide-react";

import { sendCasePrediction } from "@/api/Ai_Features_Microsrc/ai_predict";

const PredictiveAI = () => {
  const [caseType, setCaseType] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [judgeId, setJudgeId] = useState<string>("");
  const [summary, setSummary] = useState("");

  const [prediction, setPrediction] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ✅ NEW (safe addition)
  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);

  const caseTypes = [
    { type: "Civil Rights", confidence: 78, color: "bg-legal-success" },
    { type: "Contract Disputes", confidence: 85, color: "bg-legal-primary" },
    { type: "Employment Law", confidence: 72, color: "bg-legal-warning" },
    { type: "Personal Injury", confidence: 91, color: "bg-legal-info" }
  ];

  const stats = [
    { label: "Predictions Made", value: "12,847", icon: Brain },
    { label: "Accuracy Rate", value: "87.3%", icon: Target },
    { label: "Cases Analyzed", value: "45,672", icon: Scale },
    { label: "Success Improved", value: "+23%", icon: TrendingUp }
  ];

  const handleRunPrediction = async () => {
    setIsAnalyzing(true);
    setPrediction(null);

    try {
      const response = await sendCasePrediction({
        case_type: caseType,
        jurisdiction: jurisdiction,
        judge_id: judgeId ? Number(judgeId) : 0,
        brief_summary: summary
      });

      const data = response.data;

      const formattedPrediction = {
        probability: data.success_probability,
        outcome: data.predicted_outcome,
        confidence:
          data.success_probability >= 80
            ? "Very High"
            : data.success_probability >= 60
            ? "High"
            : "Medium",
        factors: data.factors.map((f: any) => ({
          factor: f.factor,
          impact:
            f.impact === "positive"
              ? "Positive"
              : f.impact === "negative"
              ? "Negative"
              : "Neutral",
          weight: Math.round(f.weight * 100)
        }))
      };

      setPrediction(formattedPrediction);

      // ✅ Add to recent predictions (no UI impact)
      setRecentPredictions((prev) => [
        {
          caseType: caseType || "Untitled Case",
          outcome: data.predicted_outcome,
          probability: data.success_probability
        },
        ...prev.slice(0, 4)
      ]);
    } catch (error) {
      console.error("Prediction failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-legal-success rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Predictive AI</h1>
              <p className="text-muted-foreground">
                AI-powered case outcome predictions and success probability analysis
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
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <stat.icon className="h-6 w-6 text-legal-success" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prediction Input */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-legal-primary" />
                  Case Analysis & Prediction
                </CardTitle>
                <CardDescription>
                  Enter case details to get AI-powered outcome predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="quick" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quick">Quick Analysis</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
                  </TabsList>

                  <TabsContent value="quick" className="mt-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Case Type</label>
                        <Input placeholder="e.g., Employment Discrimination, Contract Dispute" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Jurisdiction</label>
                        <Input placeholder="e.g., California Superior Court" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Judge (Optional)</label>
                        <Input placeholder="e.g., Hon. Sarah Mitchell" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Brief Case Summary</label>
                        <textarea 
                          className="w-full p-3 border border-input rounded-md resize-none"
                          rows={4}
                          placeholder="Provide a brief summary of your case details, key facts, and legal issues..."
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="detailed" className="mt-6">
                    <div className="text-center py-8">
                      <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Advanced Analysis</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload case documents and evidence for comprehensive prediction analysis
                      </p>
                      <Button variant="outline">
                        Upload Documents
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex gap-3">
                  <Button 
                    onClick={handleRunPrediction}
                    className="flex-1 bg-legal-primary hover:bg-legal-primary/90"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Run Prediction
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    Save Draft
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prediction Results */}
            {(prediction || isAnalyzing) && (
              <Card className="shadow-card mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-legal-success" />
                    Prediction Results
                  </CardTitle>
                  <CardDescription>
                    AI-generated case outcome probability and analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAnalyzing ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 border-4 border-legal-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Analyzing Your Case</h3>
                      <p className="text-muted-foreground">
                        Our AI is processing case details, analyzing precedents, and calculating probabilities...
                      </p>
                    </div>
                  ) : prediction && (
                    <div className="space-y-6">
                      {/* Main Prediction */}
                      <div className="text-center p-6 bg-gradient-primary rounded-lg text-white">
                        <div className="text-4xl font-bold mb-2">{prediction.probability}%</div>
                        <p className="text-lg mb-1">Success Probability</p>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {prediction.confidence} Confidence
                        </Badge>
                      </div>

                      {/* Outcome Assessment */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 border border-border rounded-lg">
                          <CheckCircle className="h-8 w-8 text-legal-success mx-auto mb-2" />
                          <p className="text-sm font-medium">Favorable</p>
                          <p className="text-xs text-muted-foreground">{prediction.probability}%</p>
                        </div>
                        <div className="text-center p-4 border border-border rounded-lg">
                          <AlertTriangle className="h-8 w-8 text-legal-warning mx-auto mb-2" />
                          <p className="text-sm font-medium">Uncertain</p>
                          <p className="text-xs text-muted-foreground">{100 - prediction.probability - 10}%</p>
                        </div>
                        <div className="text-center p-4 border border-border rounded-lg">
                          <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                          <p className="text-sm font-medium">Unfavorable</p>
                          <p className="text-xs text-muted-foreground">10%</p>
                        </div>
                      </div>

                      {/* Contributing Factors */}
                      <div>
                        <h4 className="font-semibold mb-4">Contributing Factors</h4>
                        <div className="space-y-3">
                          {prediction.factors.map((factor, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{factor.factor}</span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    factor.impact === 'Positive' ? 'bg-legal-success/10 text-legal-success' :
                                    factor.impact === 'Negative' ? 'bg-destructive/10 text-destructive' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {factor.impact}
                                  </span>
                                </div>
                                <Progress value={factor.weight * 3} className="h-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1">
                          Download Report
                        </Button>
                        <Button variant="outline">
                          Share Results
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
            {/* Case Type Success Rates */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-legal-primary" />
                  Success Rates by Type
                </CardTitle>
                <CardDescription>
                  Historical success rates for different case types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseTypes.map((type, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{type.type}</span>
                        <span className="text-sm text-muted-foreground">{type.confidence}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`${type.color} h-2 rounded-full`} 
                          style={{ width: `${type.confidence}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Predictions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-primary" />
                  Recent Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPredictions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No predictions yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentPredictions.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.caseType}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.probability}% success
                          </p>
                        </div>
                        <Badge variant="outline">
                          {item.outcome}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

                        {/* AI Insights */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Insights
                </CardTitle>
                <CardDescription className="text-white/80">
                  Key factors for success
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Strong precedent cases found</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Consider judge's recent rulings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Favorable jurisdiction trends</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAI;