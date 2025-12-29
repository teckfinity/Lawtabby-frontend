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

import { sendCasePrediction } from "@/api/Ai_Features_Microsrc/predictive_ai";

const PredictiveAI = () => {
  const [caseType, setCaseType] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [summary, setSummary] = useState("");
  const [keyFacts, setKeyFacts] = useState("");

  const [prediction, setPrediction] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Static data for right sidebar (unchanged)
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
    if (!caseType || !summary) {
      alert("Please fill in Case Type and Case Summary");
      return;
    }

    setIsAnalyzing(true);
    setPrediction(null);

    try {
      const payload = {
        case_type: caseType,
        jurisdiction: jurisdiction,
        case_summary: summary,
        key_facts: keyFacts
      };

      const response = await sendCasePrediction(payload);
      const data = response.data;

      // Map real response to UI
      setPrediction({
        success_probability: data.success_probability,
        confidence_level: data.confidence_level,
        outcome_breakdown: data.outcome_breakdown,
        contributing_factors: data.contributing_factors
      });
    } catch (error) {
      console.error("Prediction failed:", error);
      alert("Failed to generate prediction. Please try again.");
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
                        <Input 
                          placeholder="e.g., Contract Dispute"
                          value={caseType}
                          onChange={(e) => setCaseType(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Jurisdiction</label>
                        <Input 
                          placeholder="e.g., Superior Court of California"
                          value={jurisdiction}
                          onChange={(e) => setJurisdiction(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Case Summary</label>
                        <textarea 
                          className="w-full p-3 border border-input rounded-md resize-none min-h-[100px]"
                          placeholder="Brief description of the case..."
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Key Facts</label>
                        <textarea 
                          className="w-full p-3 border border-input rounded-md resize-none min-h-[120px]"
                          placeholder="Key facts and evidence..."
                          value={keyFacts}
                          onChange={(e) => setKeyFacts(e.target.value)}
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

            {/* Prediction Results - Real API Response */}
            {prediction && (
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
                  <div className="space-y-6">
                    {/* Main Success Probability */}
                    <div className="text-center p-6 bg-gradient-primary rounded-lg text-white">
                      <div className="text-4xl font-bold mb-2">{prediction.success_probability}%</div>
                      <p className="text-lg mb-1">Success Probability</p>
                      <Badge variant="secondary" className="bg-white/20 text-white text-lg px-4 py-1">
                        {prediction.confidence_level}
                      </Badge>
                    </div>

                    {/* Outcome Breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border border-border rounded-lg">
                        <CheckCircle className="h-8 w-8 text-legal-success mx-auto mb-2" />
                        <p className="text-sm font-medium">Favorable</p>
                        <p className="text-2xl font-bold">{prediction.outcome_breakdown.favorable}%</p>
                      </div>
                      <div className="text-center p-4 border border-border rounded-lg">
                        <AlertTriangle className="h-8 w-8 text-legal-warning mx-auto mb-2" />
                        <p className="text-sm font-medium">Uncertain</p>
                        <p className="text-2xl font-bold">{prediction.outcome_breakdown.uncertain}%</p>
                      </div>
                      <div className="text-center p-4 border border-border rounded-lg">
                        <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                        <p className="text-sm font-medium">Unfavorable</p>
                        <p className="text-2xl font-bold">{prediction.outcome_breakdown.unfavorable}%</p>
                      </div>
                    </div>

                    {/* Contributing Factors */}
                    <div>
                      <h4 className="font-semibold mb-4">Contributing Factors</h4>
                      <div className="space-y-3">
                        {prediction.contributing_factors.map((factor: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">{factor.name}</span>
                            <Badge 
                              variant={
                                factor.sentiment === "Positive" ? "default" :
                                factor.sentiment === "Negative" ? "destructive" :
                                "secondary"
                              }
                            >
                              {factor.sentiment}
                            </Badge>
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
                </CardContent>
              </Card>
            )}

            {/* Analyzing State */}
            {isAnalyzing && !prediction && (
              <Card className="shadow-card mt-6">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 border-4 border-legal-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analyzing Your Case</h3>
                  <p className="text-muted-foreground">
                    Our AI is processing case details, analyzing precedents, and calculating probabilities...
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - 100% STATIC & UNCHANGED */}
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
                <p className="text-sm text-muted-foreground">
                  No predictions yet.
                </p>
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