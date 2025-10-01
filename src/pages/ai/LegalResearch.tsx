import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Scale, 
  BookOpen, 
  AlertCircle, 
  Send, 
  Loader2, 
  BookMarked,
  FileText,
  Search,
  Sparkles,
  Copy,
  Check,
  Printer,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface LegalFilters {
  jurisdiction: string;
  dateFrom: string;
  dateTo: string;
  courtLevel: string;
  judge: string;
}

interface LegalResponse {
  question: string;
  summary: string;
  keyAuthorities: string[];
  analysis: string;
  citations: string[];
  filters: LegalFilters;
  timestamp: Date;
}

const LegalResearch = () => {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<LegalResponse[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<LegalFilters>({
    jurisdiction: "all",
    dateFrom: "",
    dateTo: "",
    courtLevel: "all",
    judge: ""
  });

  const exampleQuestions = [
    "What is the burden of proof in employment discrimination cases under Title VII?",
    "How does qualified immunity apply to police officers in § 1983 cases?",
    "What are the elements of negligence in tort law?",
    "Explain the doctrine of promissory estoppel in contract law"
  ];

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a legal question to research.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Simulate AI response - In production, this would call your AI API
    setTimeout(() => {
      const mockResponse: LegalResponse = {
        question: question,
        summary: "In employment discrimination cases under Title VII, plaintiffs must establish a prima facie case by showing they belong to a protected class, suffered adverse employment action, and that action was motivated by discriminatory intent. The burden then shifts to the employer to articulate a legitimate, non-discriminatory reason.",
        keyAuthorities: [
          "McDonnell Douglas Corp. v. Green, 411 U.S. 792 (1973)",
          "42 U.S.C. § 2000e-2 (Title VII of the Civil Rights Act)",
          "Texas Dept. of Community Affairs v. Burdine, 450 U.S. 248 (1981)"
        ],
        analysis: "The Supreme Court established the McDonnell Douglas burden-shifting framework, which remains the foundation for Title VII discrimination claims. First, the plaintiff must prove a prima facie case showing: (1) membership in a protected class, (2) qualification for the position, (3) adverse employment action, and (4) circumstances suggesting discriminatory motive. Once established, the burden shifts to the employer to provide a legitimate, non-discriminatory reason. The plaintiff can then demonstrate this reason is pretextual. This framework balances the need to address discrimination while preventing frivolous claims and recognizing employers' legitimate business interests.",
        citations: [
          "McDonnell Douglas Corp. v. Green, 411 U.S. 792, 802-05 (1973)",
          "42 U.S.C. § 2000e-2(a)(1)",
          "Texas Dept. of Community Affairs v. Burdine, 450 U.S. 248, 252-53 (1981)",
          "St. Mary's Honor Center v. Hicks, 509 U.S. 502 (1993)"
        ],
        filters: { ...filters },
        timestamp: new Date()
      };

      setResponses([mockResponse, ...responses]);
      setQuestion("");
      setIsLoading(false);
      
      toast({
        title: "Research Complete",
        description: "Legal analysis generated successfully."
      });
    }, 2000);
  };

  const handleCopy = (response: LegalResponse, index: number) => {
    const filterText = `
FILTERS APPLIED:
- Jurisdiction: ${response.filters.jurisdiction !== "all" ? response.filters.jurisdiction : "All"}
- Date Range: ${response.filters.dateFrom || "Any"} to ${response.filters.dateTo || "Any"}
- Court Level: ${response.filters.courtLevel !== "all" ? response.filters.courtLevel : "All"}
- Judge: ${response.filters.judge || "Any"}
    `.trim();

    const formattedText = `
LEGAL RESEARCH RESPONSE
Question: ${response.question}

${filterText}

SUMMARY:
${response.summary}

KEY AUTHORITIES:
${response.keyAuthorities.map((auth, i) => `${i + 1}. ${auth}`).join('\n')}

ANALYSIS:
${response.analysis}

CITATIONS:
${response.citations.map((cite, i) => `${i + 1}. ${cite}`).join('\n')}

DISCLAIMER: This information is for educational purposes only and does not constitute legal advice. Consult a qualified attorney for specific legal matters.
    `.trim();

    navigator.clipboard.writeText(formattedText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    
    toast({
      title: "Copied to Clipboard",
      description: "Legal research response copied successfully."
    });
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-legal-primary rounded-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Legal Research Assistant</h1>
              <p className="text-muted-foreground">AI-powered U.S. legal research with verified citations</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Input */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-legal-primary" />
                  Ask a Legal Question
                </CardTitle>
                <CardDescription>
                  Enter your U.S. legal question for detailed research with verified citations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="E.g., What is the burden of proof in employment discrimination cases under Title VII?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isLoading}
                />
                
                {/* Filters Section */}
                <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between" disabled={isLoading}>
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Advanced Filters
                      </span>
                      {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Jurisdiction */}
                      <div className="space-y-2">
                        <Label htmlFor="jurisdiction">Jurisdiction</Label>
                        <Select 
                          value={filters.jurisdiction} 
                          onValueChange={(value) => setFilters({...filters, jurisdiction: value})}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="jurisdiction">
                            <SelectValue placeholder="Select jurisdiction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Jurisdictions</SelectItem>
                            <SelectItem value="federal">Federal</SelectItem>
                            <SelectItem value="state">State</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Court Level */}
                      <div className="space-y-2">
                        <Label htmlFor="courtLevel">Court Level</Label>
                        <Select 
                          value={filters.courtLevel} 
                          onValueChange={(value) => setFilters({...filters, courtLevel: value})}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="courtLevel">
                            <SelectValue placeholder="Select court level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Courts</SelectItem>
                            <SelectItem value="supreme">U.S. Supreme Court</SelectItem>
                            <SelectItem value="circuit">Circuit Courts</SelectItem>
                            <SelectItem value="district">District Courts</SelectItem>
                            <SelectItem value="state-supreme">State Supreme Courts</SelectItem>
                            <SelectItem value="state-appellate">State Appellate Courts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date From */}
                      <div className="space-y-2">
                        <Label htmlFor="dateFrom">Date From</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                          disabled={isLoading}
                        />
                      </div>

                      {/* Date To */}
                      <div className="space-y-2">
                        <Label htmlFor="dateTo">Date To</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                          disabled={isLoading}
                        />
                      </div>

                      {/* Judge */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="judge">Judge Name (Optional)</Label>
                        <Input
                          id="judge"
                          type="text"
                          placeholder="E.g., John Roberts"
                          value={filters.judge}
                          onChange={(e) => setFilters({...filters, judge: e.target.value})}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFilters({
                        jurisdiction: "all",
                        dateFrom: "",
                        dateTo: "",
                        courtLevel: "all",
                        judge: ""
                      })}
                      disabled={isLoading}
                    >
                      Clear Filters
                    </Button>
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmit}
                    disabled={isLoading || !question.trim()}
                    className="bg-legal-primary hover:bg-legal-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Research Question
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setQuestion("")}
                    disabled={isLoading}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Responses */}
            {responses.length > 0 ? (
              <div className="space-y-6">
                {responses.map((response, index) => (
                  <Card key={index} className="shadow-card">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-5 w-5 text-legal-primary" />
                            <Badge variant="secondary">
                              {response.timestamp.toLocaleTimeString()}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{response.question}</CardTitle>
                          
                          {/* Display active filters */}
                          {(response.filters.jurisdiction !== "all" || 
                            response.filters.courtLevel !== "all" || 
                            response.filters.dateFrom || 
                            response.filters.dateTo || 
                            response.filters.judge) && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {response.filters.jurisdiction !== "all" && (
                                <Badge variant="outline" className="text-xs">
                                  {response.filters.jurisdiction === "federal" ? "Federal" : "State"}
                                </Badge>
                              )}
                              {response.filters.courtLevel !== "all" && (
                                <Badge variant="outline" className="text-xs">
                                  {response.filters.courtLevel === "supreme" ? "Supreme Court" :
                                   response.filters.courtLevel === "circuit" ? "Circuit Courts" :
                                   response.filters.courtLevel === "district" ? "District Courts" :
                                   response.filters.courtLevel === "state-supreme" ? "State Supreme" :
                                   "State Appellate"}
                                </Badge>
                              )}
                              {response.filters.dateFrom && (
                                <Badge variant="outline" className="text-xs">
                                  From: {response.filters.dateFrom}
                                </Badge>
                              )}
                              {response.filters.dateTo && (
                                <Badge variant="outline" className="text-xs">
                                  To: {response.filters.dateTo}
                                </Badge>
                              )}
                              {response.filters.judge && (
                                <Badge variant="outline" className="text-xs">
                                  Judge: {response.filters.judge}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(response, index)}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.print()}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Summary */}
                      <div>
                        <h3 className="text-sm font-semibold text-legal-primary mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          SUMMARY
                        </h3>
                        <p className="text-foreground leading-relaxed">{response.summary}</p>
                      </div>

                      {/* Key Authorities */}
                      <div>
                        <h3 className="text-sm font-semibold text-legal-primary mb-2 flex items-center gap-2">
                          <BookMarked className="h-4 w-4" />
                          KEY AUTHORITIES
                        </h3>
                        <ul className="space-y-2">
                          {response.keyAuthorities.map((authority, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-legal-primary font-medium">•</span>
                              <span className="text-foreground">{authority}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Analysis */}
                      <div>
                        <h3 className="text-sm font-semibold text-legal-primary mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          ANALYSIS
                        </h3>
                        <p className="text-foreground leading-relaxed">{response.analysis}</p>
                      </div>

                      {/* Citations */}
                      <div>
                        <h3 className="text-sm font-semibold text-legal-primary mb-2 flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          CITATIONS
                        </h3>
                        <ul className="space-y-1">
                          {response.citations.map((citation, i) => (
                            <li key={i} className="text-sm text-muted-foreground font-mono">
                              {citation}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Disclaimer */}
                      <Alert className="border-legal-warning/50 bg-legal-warning/10">
                        <AlertCircle className="h-4 w-4 text-legal-warning" />
                        <AlertDescription className="text-xs">
                          This information is for educational purposes only and does not constitute legal advice.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="py-16 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Research Yet</h3>
                  <p className="text-muted-foreground">
                    Enter a legal question above to get started with AI-powered legal research
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Example Questions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Example Questions</CardTitle>
                <CardDescription>Click to try these sample queries</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {exampleQuestions.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full text-left h-auto py-3 px-3 justify-start"
                        onClick={() => setQuestion(example)}
                        disabled={isLoading}
                      >
                        <span className="text-sm">{example}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="text-base text-white">What You Get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Verified U.S. case law citations</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Federal & state statutes</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Plain English explanations</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Pinpoint citations included</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Multi-jurisdiction coverage</span>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>✓ Be specific with your questions</p>
                <p>✓ Include relevant jurisdiction if needed</p>
                <p>✓ Mention specific statutes or cases if known</p>
                <p>✓ Ask about elements, defenses, or procedures</p>
                <p>✗ Avoid asking for personal legal advice</p>
                <p>✗ Don't rely solely on AI for case strategy</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalResearch;
