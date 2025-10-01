import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Search,
  Scale,
  Clock,
  TrendingUp,
  FileText,
  Users,
  Target,
  Plus,
  X
} from "lucide-react";
import { toast } from "sonner";

const CompareJudges = () => {
  const navigate = useNavigate();
  const [selectedJudges, setSelectedJudges] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const judges = [
    {
      id: 1,
      name: "Hon. Sarah Mitchell",
      court: "Superior Court",
      specialties: ["Civil Rights", "Employment"],
      totalCases: 1247,
      grantRate: 68,
      avgDecisionTime: 45,
      recentTrend: "up"
    },
    {
      id: 2,
      name: "Hon. Robert Chen",
      court: "District Court",
      specialties: ["Criminal", "Constitutional"],
      totalCases: 892,
      grantRate: 54,
      avgDecisionTime: 38,
      recentTrend: "stable"
    },
    {
      id: 3,
      name: "Hon. Maria Rodriguez",
      court: "Appeals Court",
      specialties: ["Corporate", "Tax"],
      totalCases: 654,
      grantRate: 71,
      avgDecisionTime: 62,
      recentTrend: "up"
    },
    {
      id: 4,
      name: "Hon. David Thompson",
      court: "Federal Court",
      specialties: ["Immigration", "Civil Rights"],
      totalCases: 1156,
      grantRate: 43,
      avgDecisionTime: 52,
      recentTrend: "down"
    }
  ];

  const addJudge = (judge) => {
    if (selectedJudges.length >= 3) {
      toast("Maximum 3 judges can be compared at once");
      return;
    }
    if (selectedJudges.find(j => j.id === judge.id)) {
      toast("Judge already selected for comparison");
      return;
    }
    setSelectedJudges([...selectedJudges, judge]);
    toast(`Added ${judge.name} to comparison`);
  };

  const removeJudge = (judgeId) => {
    setSelectedJudges(selectedJudges.filter(j => j.id !== judgeId));
    toast("Judge removed from comparison");
  };

  const filteredJudges = judges.filter(judge =>
    judge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    judge.court.toLowerCase().includes(searchQuery.toLowerCase()) ||
    judge.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/ai/judge-analytics")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Compare Judges</h1>
              <p className="text-muted-foreground">Side-by-side judicial performance analysis</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Judge Selection */}
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-legal-primary" />
                  Select Judges
                </CardTitle>
                <CardDescription>
                  Choose up to 3 judges to compare
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search judges..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredJudges.map((judge) => (
                      <div 
                        key={judge.id} 
                        className="p-3 border border-border rounded-lg hover:shadow-legal transition-all cursor-pointer"
                        onClick={() => addJudge(judge)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm leading-tight">{judge.name}</h4>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              addJudge(judge);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{judge.court}</p>
                        <div className="flex flex-wrap gap-1">
                          {judge.specialties.slice(0, 2).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Results */}
          <div className="lg:col-span-2">
            {selectedJudges.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No Judges Selected
                  </h3>
                  <p className="text-muted-foreground">
                    Choose judges from the left panel to start comparing their performance metrics
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Selected Judges Overview */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-legal-primary" />
                      Selected Judges ({selectedJudges.length}/3)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedJudges.map((judge) => (
                        <div key={judge.id} className="flex items-center gap-2 bg-legal-primary/10 rounded-full px-3 py-1">
                          <span className="text-sm font-medium">{judge.name.split(' ')[1]} {judge.name.split(' ')[2]}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-destructive/20"
                            onClick={() => removeJudge(judge.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Comparison Table */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Performance Comparison</CardTitle>
                    <CardDescription>Side-by-side analysis of key metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Metric</th>
                            {selectedJudges.map((judge) => (
                              <th key={judge.id} className="text-center p-2 font-medium min-w-32">
                                {judge.name.split(' ')[1]} {judge.name.split(' ')[2]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Court</td>
                            {selectedJudges.map((judge) => (
                              <td key={judge.id} className="text-center p-2">{judge.court}</td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Total Cases</td>
                            {selectedJudges.map((judge) => (
                              <td key={judge.id} className="text-center p-2 font-semibold">{judge.totalCases}</td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Grant Rate</td>
                            {selectedJudges.map((judge) => (
                              <td key={judge.id} className="text-center p-2">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-semibold">{judge.grantRate}%</span>
                                  <Progress value={judge.grantRate} className="w-16 h-2" />
                                </div>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Avg Decision Time</td>
                            {selectedJudges.map((judge) => (
                              <td key={judge.id} className="text-center p-2 font-semibold">{judge.avgDecisionTime} days</td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Recent Trend</td>
                            {selectedJudges.map((judge) => (
                              <td key={judge.id} className="text-center p-2">
                                <Badge variant={
                                  judge.recentTrend === 'up' ? 'default' :
                                  judge.recentTrend === 'down' ? 'destructive' : 'secondary'
                                }>
                                  {judge.recentTrend}
                                </Badge>
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-2 font-medium">Specialties</td>
                            {selectedJudges.map((judge) => (
                              <td key={judge.id} className="text-center p-2">
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {judge.specialties.map((specialty, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Insights */}
                <Card className="shadow-card bg-gradient-primary text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Comparison Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedJudges.length >= 2 && (
                        <>
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            <span className="text-sm">
                              Highest grant rate: {selectedJudges.reduce((prev, current) => 
                                prev.grantRate > current.grantRate ? prev : current
                              ).name} ({Math.max(...selectedJudges.map(j => j.grantRate))}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              Fastest decisions: {selectedJudges.reduce((prev, current) => 
                                prev.avgDecisionTime < current.avgDecisionTime ? prev : current
                              ).name} ({Math.min(...selectedJudges.map(j => j.avgDecisionTime))} days)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">
                              Most experienced: {selectedJudges.reduce((prev, current) => 
                                prev.totalCases > current.totalCases ? prev : current
                              ).name} ({Math.max(...selectedJudges.map(j => j.totalCases))} cases)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1"
                    onClick={() => toast("Comparison report downloaded!")}
                  >
                    Download Report
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => toast("Comparison shared successfully!")}
                  >
                    Share Analysis
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedJudges([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareJudges;