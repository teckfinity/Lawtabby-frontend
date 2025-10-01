import { useState } from "react";
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

const CaseHistory = () => {
  const navigate = useNavigate();
  const { judgeId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);

  const judgeData = {
    name: "Hon. Sarah Mitchell",
    court: "Superior Court of California"
  };

  const cases = [
    {
      id: 1,
      caseNumber: "CV-2024-001234",
      title: "TechCorp Inc. v. StartupXYZ LLC",
      type: "Contract Dispute",
      plaintiff: "TechCorp Inc.",
      defendant: "StartupXYZ LLC",
      filedDate: "2024-01-15",
      decisionDate: "2024-03-10",
      status: "Closed",
      outcome: "Granted",
      summary: "Motion for summary judgment regarding breach of software licensing agreement",
      amount: "$2,500,000",
      duration: "55 days",
      precedentValue: "High"
    },
    {
      id: 2,
      caseNumber: "CV-2024-001189",
      title: "Employee Rights Coalition v. MegaCorp",
      type: "Employment Law",
      plaintiff: "Employee Rights Coalition", 
      defendant: "MegaCorp",
      filedDate: "2024-01-08",
      decisionDate: "2024-02-28",
      status: "Closed",
      outcome: "Denied",
      summary: "Class action regarding overtime compensation and working conditions",
      amount: "$15,000,000",
      duration: "51 days",
      precedentValue: "Medium"
    },
    {
      id: 3,
      caseNumber: "CV-2024-000987",
      title: "Johnson v. City Planning Commission",
      type: "Civil Rights",
      plaintiff: "Robert Johnson",
      defendant: "City Planning Commission",
      filedDate: "2023-11-20",
      decisionDate: "2024-01-15",
      status: "Closed", 
      outcome: "Granted",
      summary: "Constitutional challenge to zoning restrictions on religious buildings",
      amount: "$500,000",
      duration: "56 days",
      precedentValue: "High"
    },
    {
      id: 4,
      caseNumber: "CV-2024-001456",
      title: "DataSecure Inc. v. Former Employee",
      type: "Intellectual Property",
      plaintiff: "DataSecure Inc.",
      defendant: "John Mitchell", 
      filedDate: "2024-02-01",
      decisionDate: "Pending",
      status: "Active",
      outcome: "Pending",
      summary: "Injunction request for trade secret misappropriation",
      amount: "$1,200,000",
      duration: "22 days",
      precedentValue: "Medium"
    },
    {
      id: 5,
      caseNumber: "CV-2023-009876",
      title: "Green Energy Solutions v. State Regulatory Board",
      type: "Administrative Law",
      plaintiff: "Green Energy Solutions",
      defendant: "State Regulatory Board",
      filedDate: "2023-09-15",
      decisionDate: "2023-12-08",
      status: "Closed",
      outcome: "Granted",
      summary: "Challenge to renewable energy permit denial",
      amount: "$8,750,000", 
      duration: "84 days",
      precedentValue: "High"
    }
  ];

  const stats = [
    { label: "Total Cases", value: cases.length.toString(), icon: FileText },
    { label: "Closed Cases", value: cases.filter(c => c.status === "Closed").length.toString(), icon: CheckCircle },
    { label: "Active Cases", value: cases.filter(c => c.status === "Active").length.toString(), icon: Clock },
    { label: "Avg Decision Time", value: "59 days", icon: TrendingUp }
  ];

  const filteredCases = cases.filter(case_ =>
    case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOutcomeIcon = (outcome) => {
    switch(outcome) {
      case "Granted": return <CheckCircle className="h-4 w-4 text-legal-success" />;
      case "Denied": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-legal-warning" />;
    }
  };

  const getOutcomeColor = (outcome) => {
    switch(outcome) {
      case "Granted": return "bg-legal-success/10 text-legal-success border-legal-success/20";
      case "Denied": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-legal-warning/10 text-legal-warning border-legal-warning/20";
    }
  };

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
            <div className="p-2 bg-legal-info rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Case History</h1>
              <p className="text-muted-foreground">
                Complete case history for {judgeData.name}
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
                <Badge variant="secondary">All Cases ({filteredCases.length})</Badge>
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
          {filteredCases.map((case_) => (
            <Card key={case_.id} className="shadow-card hover:shadow-legal transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{case_.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {case_.caseNumber}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{case_.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Filed: {new Date(case_.filedDate).toLocaleDateString()}</span>
                      {case_.decisionDate !== "Pending" && (
                        <span>Decided: {new Date(case_.decisionDate).toLocaleDateString()}</span>
                      )}
                      <span>Duration: {case_.duration}</span>
                      <span>Amount: {case_.amount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getOutcomeColor(case_.outcome)}`}>
                      <div className="flex items-center gap-1">
                        {getOutcomeIcon(case_.outcome)}
                        {case_.outcome}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {case_.type}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Plaintiff:</span>
                    <p className="text-foreground">{case_.plaintiff}</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Defendant:</span>
                    <p className="text-foreground">{case_.defendant}</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Precedent Value:</span>
                    <p className="text-foreground">{case_.precedentValue}</p>
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
                      Precedent: {case_.precedentValue}
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
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Case Detail Modal (Simple version for now) */}
        {selectedCase && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedCase.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCase(null)}>
                    ×
                  </Button>
                </div>
                <CardDescription>{selectedCase.caseNumber}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Case Summary</h4>
                    <p className="text-sm text-muted-foreground">{selectedCase.summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Case Type</h4>
                      <p className="text-sm text-muted-foreground">{selectedCase.type}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Status</h4>
                      <p className="text-sm text-muted-foreground">{selectedCase.status}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Outcome</h4>
                      <p className="text-sm text-muted-foreground">{selectedCase.outcome}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Amount</h4>
                      <p className="text-sm text-muted-foreground">{selectedCase.amount}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Full Case
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
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

        {/* Empty State */}
        {filteredCases.length === 0 && (
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
    </div>
  );
};

export default CaseHistory;