import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  FileText,
  Scale,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Printer
} from "lucide-react";
import { getJudgeCaseHistory } from "@/api/Ai_Features_Microsrc/judge_analytcs";

const CaseHistory = () => {
  const navigate = useNavigate();
  const { judgeId } = useParams<{ judgeId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [caseHistory, setCaseHistory] = useState<any>({
    judge: { full_name: "Loading..." },
    statistics: { total_cases: 0, active_cases: 0, closed_cases: 0, avg_decision_days: 0 },
    cases: []
  });

  useEffect(() => {
    if (!judgeId) return;

    const fetchCaseHistory = async () => {
      try {
        setLoading(true);
        const res = await getJudgeCaseHistory(Number(judgeId), {
          search: searchTerm || undefined,
          limit: 10,
          page: 1
        });
        setCaseHistory(res.data);
      } catch (error) {
        console.error("Failed to load case history:", error);
        setCaseHistory({
          judge: { full_name: "Unknown Judge" },
          statistics: { total_cases: 0, active_cases: 0, closed_cases: 0, avg_decision_days: 0 },
          cases: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCaseHistory();
  }, [judgeId, searchTerm]);


  // 🔒 SAFE NORMALIZATION (OPTION 2 FIX)
const statistics =
  caseHistory?.statistics ||
  caseHistory?.summary || {
    total_cases: 0,
    active_cases: 0,
    closed_cases: 0,
    avg_decision_days: 0,
    avg_decision_time: 0,
  };

const judge = caseHistory?.judge || { full_name: "Unknown Judge" };
const cases = caseHistory?.cases || [];

// avg field backend / frontend mismatch fix
const avgDecisionDays =
  statistics.avg_decision_days ??
  statistics.avg_decision_time ??
  0;

const stats = [
  {
    label: "Total Cases",
    value: statistics.total_cases.toString(),
    icon: FileText,
  },
  {
    label: "Closed Cases",
    value: statistics.closed_cases.toString(),
    icon: CheckCircle,
  },
  {
    label: "Active Cases",
    value: statistics.active_cases.toString(),
    icon: Clock,
  },
  {
    label: "Avg Decision Time",
    value: avgDecisionDays > 0 ? `${avgDecisionDays} days` : "N/A",
    icon: TrendingUp,
  },
];

  const getOutcomeIcon = (outcome: string) => {
    if (outcome?.toLowerCase().includes('grant')) return <CheckCircle className="h-4 w-4 text-legal-success" />;
    if (outcome?.toLowerCase().includes('deny')) return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-legal-warning" />;
  };

  const getOutcomeColor = (outcome: string) => {
    if (outcome?.toLowerCase().includes('grant')) return "bg-legal-success/10 text-legal-success border-legal-success/20";
    if (outcome?.toLowerCase().includes('deny')) return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-legal-warning/10 text-legal-warning border-legal-warning/20";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  };

  // Safe print function - no page reload
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading case history...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Fixed: Using navigate() instead of window.location.href */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/ai/judge/${judgeId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Judge Profile
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-legal-info rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Case History</h1>
              <p className="text-muted-foreground">
                Complete case history for {judge.full_name}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <stat.icon className="h-6 w-6 text-legal-info" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search and Filters */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-legal-primary" />
                Search & Filter Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by case number, title, or type..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date Range
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  All Cases ({statistics.total_cases})
                </Badge>
                <Badge variant="outline">Contract Disputes</Badge>
                <Badge variant="outline">Employment Law</Badge>
                <Badge variant="outline">Civil Rights</Badge>
                <Badge variant="outline">Active Cases</Badge>
                <Badge variant="outline">Closed Cases</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cases List */}
        <div className="space-y-4">
          {cases.length > 0 ? (
            cases.map((case_: any) => (
              <Card key={case_.docket_id} className="shadow-card hover:shadow-legal transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{case_.case_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {case_.case_number}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {case_.opinion_excerpt || "No summary available"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Filed: {formatDate(case_.date_filed)}</span>
                        {case_.date_decided && (
                          <span>Decided: {formatDate(case_.date_decided)}</span>
                        )}
                        <span>Duration: {case_.duration_days ? `${case_.duration_days} days` : "Ongoing"}</span>
                        <span>Court: {case_.court}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getOutcomeColor(case_.outcome || case_.status)}`}>
                        <div className="flex items-center gap-1">
                          {getOutcomeIcon(case_.outcome || case_.status)}
                          {case_.status}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {case_.case_type}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Parties:</span>
                      <p className="text-foreground">
                        {case_.parties?.length > 0 ? case_.parties.join(" vs ") : "Not available"}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Citations:</span>
                      <p className="text-foreground">{case_.citations?.total || 0}</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Precedent Value:</span>
                      <p className="text-foreground">{case_.precedent_value}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={case_.status === "Active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {case_.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Precedent: {case_.precedent_value}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedCase(case_)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Documents
                      </Button>
                      {/* Fixed: Safe print using function */}
                      <Button size="sm" variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
                <p className="text-muted-foreground">
                  No cases match your search criteria. Try adjusting your filters.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Case Detail Modal */}
        {selectedCase && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedCase.case_name}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCase(null)}>
                    ×
                  </Button>
                </div>
                <CardDescription>{selectedCase.case_number}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Case Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCase.opinion_excerpt || "No summary available"}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Case Type</h4>
                      <p className="text-sm text-muted-foreground">{selectedCase.case_type}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Status</h4>
                      <p className="text-sm text-muted-foreground">{selectedCase.status}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Court</h4>
                      <p className="text-sm text-muted-foreground">{selectedCase.court}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Precedent Value</h4>
                      <p className="text-sm text-muted-foreground">{selectedCase.precedent_value}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Full Case
                    </Button>
                    {/* Fixed: Safe print */}
                    <Button variant="outline" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Case
                    </Button>
                    <Button variant="outline">
                      <Scale className="h-4 w-4 mr-2" />
                      Similar Cases
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseHistory;