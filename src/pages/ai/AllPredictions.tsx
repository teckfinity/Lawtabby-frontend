import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Filter,
  Download,
  Eye,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Printer
} from "lucide-react";
import { toast } from "sonner";

const AllPredictions = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const predictions = [
    {
      id: 1,
      caseTitle: "Employment Discrimination Lawsuit",
      caseType: "Employment Law",
      predictedSuccess: 78,
      confidence: "High",
      status: "Active",
      createdDate: "2024-01-15",
      lastUpdated: "2024-01-20",
      outcome: "Favorable",
      factors: [
        { name: "Judge History", weight: 25, impact: "Positive" },
        { name: "Case Precedents", weight: 30, impact: "Positive" },
        { name: "Evidence Strength", weight: 20, impact: "Neutral" }
      ],
      riskLevel: "Low"
    },
    {
      id: 2,
      caseTitle: "Contract Breach Settlement",
      caseType: "Contract Law",
      predictedSuccess: 45,
      confidence: "Medium",
      status: "Completed",
      createdDate: "2024-01-10",
      lastUpdated: "2024-01-18",
      outcome: "Challenging",
      factors: [
        { name: "Contract Terms", weight: 35, impact: "Negative" },
        { name: "Jurisdiction", weight: 20, impact: "Neutral" },
        { name: "Legal Precedent", weight: 25, impact: "Positive" }
      ],
      riskLevel: "High"
    },
    {
      id: 3,
      caseTitle: "Personal Injury Claim",
      caseType: "Personal Injury",
      predictedSuccess: 89,
      confidence: "Very High",
      status: "Active",
      createdDate: "2024-01-12",
      lastUpdated: "2024-01-22",
      outcome: "Very Favorable",
      factors: [
        { name: "Injury Severity", weight: 40, impact: "Positive" },
        { name: "Liability Evidence", weight: 35, impact: "Positive" },
        { name: "Insurance Coverage", weight: 15, impact: "Positive" }
      ],
      riskLevel: "Very Low"
    },
    {
      id: 4,
      caseTitle: "Civil Rights Violation",
      caseType: "Civil Rights",
      predictedSuccess: 67,
      confidence: "High",
      status: "Active",
      createdDate: "2024-01-08",
      lastUpdated: "2024-01-19",
      outcome: "Favorable",
      factors: [
        { name: "Constitutional Issues", weight: 30, impact: "Positive" },
        { name: "Witness Testimony", weight: 25, impact: "Positive" },
        { name: "Precedent Cases", weight: 20, impact: "Neutral" }
      ],
      riskLevel: "Medium"
    },
    {
      id: 5,
      caseTitle: "Intellectual Property Dispute",
      caseType: "IP Law",
      predictedSuccess: 32,
      confidence: "Medium",
      status: "Review",
      createdDate: "2024-01-05",
      lastUpdated: "2024-01-21",
      outcome: "Unfavorable",
      factors: [
        { name: "Patent Validity", weight: 40, impact: "Negative" },
        { name: "Prior Art", weight: 30, impact: "Negative" },
        { name: "Technical Evidence", weight: 20, impact: "Neutral" }
      ],
      riskLevel: "Very High"
    }
  ];

  const stats = [
    { label: "Total Predictions", value: "47", icon: Target },
    { label: "Average Success Rate", value: "68%", icon: TrendingUp },
    { label: "High Confidence", value: "32", icon: CheckCircle },
    { label: "Active Cases", value: "18", icon: Clock }
  ];

  const filteredPredictions = predictions
    .filter(pred => {
      const matchesSearch = pred.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           pred.caseType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || pred.status.toLowerCase() === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      if (sortBy === "success") return b.predictedSuccess - a.predictedSuccess;
      if (sortBy === "confidence") {
        const confidenceOrder = { "Very High": 4, "High": 3, "Medium": 2, "Low": 1 };
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      }
      return 0;
    });

  const getSuccessIcon = (success) => {
    if (success >= 70) return <CheckCircle className="h-4 w-4 text-legal-success" />;
    if (success >= 40) return <AlertTriangle className="h-4 w-4 text-legal-warning" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getSuccessColor = (success) => {
    if (success >= 70) return "text-legal-success";
    if (success >= 40) return "text-legal-warning";
    return "text-destructive";
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/ai/predictive")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Predictive AI
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">All Predictions</h1>
              <p className="text-muted-foreground">Comprehensive view of your case predictions and outcomes</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => toast("Predictions exported successfully!")}
              className="bg-legal-primary hover:bg-legal-primary/90"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
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
                  <stat.icon className="h-6 w-6 text-legal-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="shadow-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search predictions by case title or type..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <select 
                  className="px-3 py-2 border border-input rounded-md text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="review">Review</option>
                </select>
                
                <select 
                  className="px-3 py-2 border border-input rounded-md text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recent">Most Recent</option>
                  <option value="success">Success Rate</option>
                  <option value="confidence">Confidence</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics View</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {/* Predictions List */}
            <div className="space-y-4">
              {filteredPredictions.map((prediction) => (
                <Card key={prediction.id} className="shadow-card hover:shadow-legal transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{prediction.caseTitle}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{prediction.caseType}</Badge>
                          <Badge variant={
                            prediction.status === 'Active' ? 'default' :
                            prediction.status === 'Completed' ? 'secondary' : 'destructive'
                          }>
                            {prediction.status}
                          </Badge>
                          <Badge variant="outline" className={`${
                            prediction.riskLevel === 'Very Low' || prediction.riskLevel === 'Low' ? 'border-legal-success text-legal-success' :
                            prediction.riskLevel === 'Medium' ? 'border-legal-warning text-legal-warning' :
                            'border-destructive text-destructive'
                          }`}>
                            {prediction.riskLevel} Risk
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          {getSuccessIcon(prediction.predictedSuccess)}
                          <span className={`text-2xl font-bold ${getSuccessColor(prediction.predictedSuccess)}`}>
                            {prediction.predictedSuccess}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{prediction.confidence} Confidence</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Success Probability</h4>
                        <Progress value={prediction.predictedSuccess} className="mb-2" />
                        <p className="text-sm text-muted-foreground">{prediction.outcome}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Top Contributing Factors</h4>
                        <div className="space-y-1">
                          {prediction.factors.slice(0, 2).map((factor, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{factor.name}</span>
                              <span className={`${
                                factor.impact === 'Positive' ? 'text-legal-success' :
                                factor.impact === 'Negative' ? 'text-destructive' :
                                'text-muted-foreground'
                              }`}>
                                {factor.impact}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {new Date(prediction.createdDate).toLocaleDateString()}</span>
                        <span>Updated: {new Date(prediction.lastUpdated).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toast("Prediction details opened")}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => toast("Prediction updated with latest data")}
                        >
                          Update Analysis
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            {/* Analytics View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-legal-primary" />
                    Success Rate Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { range: "90-100%", count: 1, color: "bg-legal-success" },
                      { range: "70-89%", count: 2, color: "bg-legal-info" },
                      { range: "50-69%", count: 1, color: "bg-legal-warning" },
                      { range: "0-49%", count: 1, color: "bg-destructive" }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.range}</span>
                          <span className="text-sm text-muted-foreground">{item.count} cases</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full`} 
                            style={{ width: `${(item.count / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-legal-primary" />
                    Case Type Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: "Personal Injury", success: 89, cases: 1 },
                      { type: "Employment Law", success: 78, cases: 1 },
                      { type: "Civil Rights", success: 67, cases: 1 },
                      { type: "Contract Law", success: 45, cases: 1 },
                      { type: "IP Law", success: 32, cases: 1 }
                    ].map((item, index) => (
                      <div key={index} className="p-3 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{item.type}</span>
                          <span className="text-sm text-muted-foreground">{item.cases} case(s)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={item.success} className="flex-1" />
                          <span className={`font-semibold ${getSuccessColor(item.success)}`}>
                            {item.success}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AllPredictions;