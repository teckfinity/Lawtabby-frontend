import { useState, useCallback, useRef } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, Brain, Target, BarChart3, AlertTriangle, Upload,
  CheckCircle, XCircle, Zap, Scale, Clock,
  Trash2, Save, AlertCircle, Download, Share2, FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  usePlatformStats,
  useCaseTypeRates,
  usePredictionDrafts,
  useRunPrediction,
  useSaveDraft,
  useDeleteDraft,
  useParseCaseDocument,
} from "@/api/hooks";
import { LibraryFileSourceButtons } from "@/components/library/LibraryFileSourceButtons";

// ── Download helper ────────────────────────────────────────────────────────────
function buildReportText(
  caseType: string,
  jurisdiction: string,
  caseSummary: string,
  keyFacts: string,
  result: PredictionResult
): string {
  const line = "─".repeat(50);
  const date = new Date().toLocaleString();

  return `
LEXORBIT – PREDICTIVE AI REPORT
Generated: ${date}
${line}

CASE DETAILS
Case Type:   ${caseType || "Not specified"}
Jurisdiction:${jurisdiction || "Not specified"}

Case Summary:
${caseSummary || "Not specified"}

Key Facts:
${keyFacts || "Not specified"}

${line}
PREDICTION RESULTS
${line}

Success Probability: ${result.success_probability}%
Confidence Level:    ${result.confidence_level}
Est. Decision Time:  ${result.estimated_decision_time}
Similar Cases Used:  ${result.total_similar_cases.toLocaleString()}
${result.recommendation_label ? `\nRecommendation:      ${result.recommendation_label}\n${result.recommendation_action || ""}` : ""}

OUTCOME BREAKDOWN (similar past cases)
  Favorable:   ${result.outcome_breakdown.favorable}%
  Uncertain:   ${result.outcome_breakdown.uncertain}%
  Unfavorable: ${result.outcome_breakdown.unfavorable}%

WHAT WE CONSIDERED
${result.contributing_factors
  .map((f) => `  • ${f.name}${f.detail ? `: ${f.detail}` : ""}`)
  .join("\n")}

KEY REASONS
${result.ai_insights.map((i) => `  • ${i}`).join("\n")}

${line}
DISCLAIMER: This analysis is for informational purposes only and does
not constitute legal advice. Consult a qualified attorney.
${line}
`.trim();
}

const CASE_FILE_ACCEPT =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const CASE_FILE_EXTENSIONS = new Set(["pdf", "docx", "txt"]);

function formatPredictionsLeft(stats: { predictions_limit: number | null; predictions_remaining: number | null } | undefined): string {
  if (!stats) return "0";
  if (stats.predictions_limit === 0) return "Upgrade plan";
  if (stats.predictions_limit == null) return "Unlimited";
  return String(stats.predictions_remaining ?? 0);
}

const PredictiveAI = () => {
  const { toast } = useToast();
  const isAuthenticated = !!localStorage.getItem("authToken");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [caseType,     setCaseType]     = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [summary,      setSummary]      = useState("");
  const [keyFacts,     setKeyFacts]     = useState("");
  const [activeTab,    setActiveTab]    = useState<"quick" | "detailed">("quick");
  const [prediction,   setPrediction]   = useState<PredictionResult | null>(null);

  // Advanced Analysis – file upload state
  const [uploadedFile,    setUploadedFile]    = useState<File | null>(null);
  const [detailedSummary, setDetailedSummary] = useState("");
  const [detailedFacts,   setDetailedFacts]   = useState("");

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: stats,     isLoading: statsLoading  } = usePlatformStats();
  const { data: caseRates, isLoading: ratesLoading  } = useCaseTypeRates();
  const { data: myDrafts,  isLoading: draftsLoading } = usePredictionDrafts(20);

  const runMutation    = useRunPrediction();
  const saveMutation   = useSaveDraft();
  const deleteMutation = useDeleteDraft();
  const parseMutation  = useParseCaseDocument();

  const isAnalyzing = runMutation.isPending;
  const isSaving    = saveMutation.isPending;
  const isParsingFile = parseMutation.isPending;

  const maxUploadMb = stats?.max_upload_mb ?? 10;
  const maxUploadBytes = maxUploadMb * 1024 * 1024;

  // ── Run Prediction ────────────────────────────────────────────────────────
  const handleRunPrediction = useCallback(async () => {
    // For quick tab use form fields; for detailed tab use the uploaded file text
    const ct  = activeTab === "quick" ? caseType     : caseType;
    const jur = activeTab === "quick" ? jurisdiction : jurisdiction;
    const sm  = activeTab === "quick" ? summary      : detailedSummary;
    const kf  = activeTab === "quick" ? keyFacts     : detailedFacts;

    const hasInput = [ct, jur, sm, kf].some((v) => v.trim().length > 0);
    if (!hasInput) {
      toast({
        title: "Input required",
        description: activeTab === "detailed"
          ? "Please upload a document or fill in the fields below."
          : "Please fill in at least one field before running a prediction.",
        variant: "destructive",
      });
      return;
    }

    setPrediction(null);
    try {
      const result = await runMutation.mutateAsync({
        case_type:     ct,
        jurisdiction:  jur,
        case_summary:  sm,
        key_facts:     kf,
        analysis_mode: activeTab,
      });
      setPrediction(result);
    } catch {
      // Error toast handled by hook's onError
    }
  }, [caseType, jurisdiction, summary, keyFacts, detailedSummary, detailedFacts, activeTab, runMutation, toast]);

  // ── Save Draft ────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(() => {
    if (!prediction) return;
    saveMutation.mutate({
      case_type:           caseType,
      jurisdiction,
      case_summary:        summary || detailedSummary,
      key_facts:           keyFacts || detailedFacts,
      success_probability: prediction.success_probability,
      confidence_level:    prediction.confidence_level,
      result_json:         prediction as unknown as Record<string, unknown>,
    });
  }, [prediction, caseType, jurisdiction, summary, keyFacts, detailedSummary, detailedFacts, saveMutation]);

  // ── Delete Draft ──────────────────────────────────────────────────────────
  const handleDeleteDraft = useCallback((draftId: number) => {
    deleteMutation.mutate(draftId);
  }, [deleteMutation]);

  // ── Download Report ───────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!prediction) return;
    const text = buildReportText(caseType, jurisdiction, summary || detailedSummary, keyFacts || detailedFacts, prediction);
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `lexorbit-prediction-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Prediction report saved to your device." });
  }, [prediction, caseType, jurisdiction, summary, detailedSummary, keyFacts, detailedFacts, toast]);

  // ── Share Results ─────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!prediction) return;
    const text = `LexOrbit Predictive AI Result\n\nCase: ${caseType || "N/A"} | ${jurisdiction || "N/A"}\nSuccess Probability: ${prediction.success_probability}%\nConfidence: ${prediction.confidence_level}\nOutcome: Favorable ${prediction.outcome_breakdown.favorable}% | Uncertain ${prediction.outcome_breakdown.uncertain}% | Unfavorable ${prediction.outcome_breakdown.unfavorable}%`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "LexOrbit Prediction", text });
      } catch {
        // User cancelled share — no error needed
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Prediction summary copied to clipboard." });
    }
  }, [prediction, caseType, jurisdiction, toast]);

  // ── File Upload for Detailed Analysis ────────────────────────────────────
  const processCaseFile = useCallback(async (file: File) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload a case document.",
        variant: "destructive",
      });
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "doc") {
      toast({
        title: "Use .docx or PDF",
        description: "Older .doc files are not supported. Save as Word (.docx) or export as PDF.",
        variant: "destructive",
      });
      return;
    }
    if (!CASE_FILE_EXTENSIONS.has(ext)) {
      toast({
        title: "File type not supported",
        description: "Please upload a PDF, Word (.docx), or text (.txt) file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > maxUploadBytes) {
      toast({
        title: "File too large",
        description: `Your plan allows up to ${maxUploadMb} MB per document.`,
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setDetailedSummary("");
    setDetailedFacts("");

    try {
      const parsed = await parseMutation.mutateAsync(file);
      setDetailedSummary(parsed.case_summary);
      setDetailedFacts(parsed.key_facts);
      toast({
        title: "Document ready",
        description: `${parsed.filename} loaded. Click Run Prediction when ready.`,
      });
    } catch {
      setUploadedFile(null);
    }
  }, [isAuthenticated, parseMutation, toast, maxUploadBytes, maxUploadMb]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (file) await processCaseFile(file);
  }, [processCaseFile]);

  // ── Bar colour for success rates ──────────────────────────────────────────
  const rateBarColor = (rate: number) =>
    rate >= 80 ? "bg-legal-success" :
    rate >= 60 ? "bg-legal-primary" :
    rate >= 40 ? "bg-legal-warning" : "bg-destructive";

  // ── Stat cards ──
  const statCards = isAuthenticated
    ? [
        {
          label: "Predictions Left",
          value: formatPredictionsLeft(stats),
          Icon: Target,
        },
        {
          label: "Predictions Made",
          value: stats != null ? stats.predictions_made.toLocaleString() : "0",
          Icon: TrendingUp,
        },
        {
          label: "Used This Month",
          value: stats != null ? stats.predictions_used.toLocaleString() : "0",
          Icon: Brain,
        },
        {
          label: "Case Analyses",
          value: stats != null ? stats.case_analyses.toLocaleString() : "0",
          Icon: Scale,
        },
      ]
    : [];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
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

          {/* Stat cards — signed-in users only */}
          {isAuthenticated && (
          <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
            {statsLoading
              ? Array.from({ length: statCards.length }).map((_, i) => (
                  <Card key={i} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-7 w-20" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-6 w-6 rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : statCards.map((s) => (
                  <Card key={s.label} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-foreground">{s.value}</p>
                          <p className="text-sm text-muted-foreground">{s.label}</p>
                        </div>
                        <s.Icon className="h-6 w-6 text-legal-success" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
          )}
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Form ── */}
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
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => { setActiveTab(v as "quick" | "detailed"); setPrediction(null); }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quick">Quick Analysis</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
                  </TabsList>

                  {/* ── Quick Analysis ── */}
                  <TabsContent value="quick" className="mt-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Case Type</label>
                        <Input placeholder="e.g., Contract Dispute" value={caseType} onChange={(e) => setCaseType(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Jurisdiction</label>
                        <Input placeholder="e.g., Superior Court of California" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Case Summary</label>
                        <textarea
                          className="w-full p-3 border border-input rounded-md resize-none min-h-[100px] bg-background text-sm"
                          placeholder="Brief description of the case..."
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Key Facts</label>
                        <textarea
                          className="w-full p-3 border border-input rounded-md resize-none min-h-[120px] bg-background text-sm"
                          placeholder="Key facts and evidence..."
                          value={keyFacts}
                          onChange={(e) => setKeyFacts(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── Detailed Analysis (file upload) ── */}
                  <TabsContent value="detailed" className="mt-6">
                    <div className="space-y-4">
                      {/* File upload area */}
                      <div
                        className={`border-2 border-dashed border-input rounded-xl p-10 text-center transition-all ${
                          isParsingFile
                            ? "opacity-70 cursor-wait"
                            : uploadedFile
                            ? "cursor-pointer hover:border-legal-primary hover:bg-legal-primary/5"
                            : ""
                        }`}
                        onClick={() => {
                          if (!isParsingFile && uploadedFile) {
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        {isParsingFile ? (
                          <>
                            <Zap className="h-10 w-10 text-legal-primary mx-auto mb-3 animate-spin" />
                            <p className="font-semibold text-foreground">Reading your document…</p>
                            <p className="text-sm text-muted-foreground mt-1">This usually takes a few seconds</p>
                          </>
                        ) : uploadedFile ? (
                          <>
                            <FileText className="h-10 w-10 text-legal-primary mx-auto mb-3" />
                            <p className="font-semibold text-foreground">{uploadedFile.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {(uploadedFile.size / 1024).toFixed(1)} KB · Click to replace
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="font-semibold text-foreground">Upload Case Document</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              PDF, Word (.docx), or text file
                            </p>
                            <div className="mt-4">
                              <LibraryFileSourceButtons
                                accept={CASE_FILE_ACCEPT}
                                compatibleTypes={["pdf", "docx", "txt"]}
                                onFileReady={processCaseFile}
                                disabled={isParsingFile}
                                chooseLabel="Choose File"
                                chooseClassName="bg-legal-primary hover:bg-legal-primary/90"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground/80 mt-3">
                              Up to {maxUploadMb} MB on your plan · Or pick from Library
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={CASE_FILE_ACCEPT}
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isParsingFile}
                      />

                      {/* Also allow manual entry in detailed mode */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Case Type <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <Input placeholder="e.g., Contract Dispute" value={caseType} onChange={(e) => setCaseType(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Jurisdiction <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <Input placeholder="e.g., Superior Court of California" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} />
                      </div>

                      {detailedSummary && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Extracted Case Summary</label>
                          <textarea
                            className="w-full p-3 border border-input rounded-md resize-none min-h-[100px] bg-background text-sm"
                            value={detailedSummary}
                            onChange={(e) => setDetailedSummary(e.target.value)}
                          />
                        </div>
                      )}
                      {detailedFacts && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Extracted Key Facts</label>
                          <textarea
                            className="w-full p-3 border border-input rounded-md resize-none min-h-[100px] bg-background text-sm"
                            value={detailedFacts}
                            onChange={(e) => setDetailedFacts(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action buttons */}
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleRunPrediction}
                    className="flex-1 bg-legal-primary hover:bg-legal-primary/90"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <><Zap className="h-4 w-4 mr-2 animate-spin" />Analyzing…</>
                    ) : (
                      <><TrendingUp className="h-4 w-4 mr-2" />Run Prediction</>
                    )}
                  </Button>

                  {prediction && isAuthenticated && (
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
                      {isSaving
                        ? <><Zap className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                        : <><Save className="h-4 w-4 mr-2" />Save Draft</>}
                    </Button>
                  )}
                </div>

                {prediction && !isAuthenticated && (
                  <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Sign in to save this prediction to your account.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Analyzing spinner */}
            {isAnalyzing && (
              <Card className="shadow-card mt-6">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 border-4 border-legal-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analyzing Your Case</h3>
                  <p className="text-muted-foreground">
                    Processing case details, analysing precedents, and calculating probabilities…
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ── Prediction Results ── */}
            {prediction && !isAnalyzing && (
              <Card className="shadow-card mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-legal-success" />
                    Prediction Results
                  </CardTitle>
                  <CardDescription>
                    {prediction.analysis_basis || (
                      <>Based on {prediction.total_similar_cases.toLocaleString()} similar past cases in our database.</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">

                    {/* Proceed / caution / reconsider */}
                    {prediction.recommendation_label && (
                      <div className={`rounded-lg border p-4 ${
                        prediction.risk_level === "Low"
                          ? "border-legal-success/40 bg-legal-success/5"
                          : prediction.risk_level === "Medium"
                          ? "border-legal-warning/40 bg-legal-warning/5"
                          : "border-destructive/40 bg-destructive/5"
                      }`}>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                          Should you proceed?
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {prediction.recommendation_label}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {prediction.recommendation_action}
                        </p>
                      </div>
                    )}

                    {/* Hero probability */}
                    <div className="text-center p-6 bg-gradient-primary rounded-lg text-white">
                      <div className="text-4xl font-bold mb-2">
                        {prediction.success_probability}%
                      </div>
                      <p className="text-lg mb-1">Success Probability</p>
                      <Badge variant="secondary" className="bg-white/20 text-white text-lg px-4 py-1">
                        {prediction.confidence_level}
                      </Badge>
                      <p className="text-xs text-white/70 mt-2">
                        Est. decision time: <strong>{prediction.estimated_decision_time}</strong>
                      </p>
                      <p className="text-xs text-white/60 mt-2 max-w-md mx-auto leading-relaxed">
                        Not legal advice. Estimate based on similar past cases and your case facts.
                      </p>
                    </div>

                    {/* Key Reasons first — main lawyer value */}
                    {prediction.ai_insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Key Reasons</h4>
                        <div className="space-y-2">
                          {prediction.ai_insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-legal-success mt-0.5 shrink-0" />
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outcome breakdown */}
                    <div>
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
                      {prediction.outcome_breakdown_basis && (
                        <p className="text-xs text-muted-foreground mt-2 text-center leading-relaxed">
                          How similar past cases concluded: {prediction.outcome_breakdown_basis}
                        </p>
                      )}
                    </div>

                    {/* Supporting context */}
                    {prediction.contributing_factors.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">What we considered</h4>
                        <div className="space-y-2">
                          {prediction.contributing_factors.map((factor, i) => (
                            <div key={i} className="p-3 bg-muted/50 rounded-lg">
                              <span className="text-sm font-medium">{factor.name}</span>
                              {factor.detail && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{factor.detail}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Download + Share */}
                    <div className="flex gap-3">
                      <Button className="flex-1" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                      <Button variant="outline" onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-6">

            {/* Success Rates by Type */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-legal-primary" />
                  Success Rates by Type
                </CardTitle>
                <CardDescription>Historical success rates for different case types</CardDescription>
              </CardHeader>
              <CardContent>
                {ratesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (caseRates ?? []).length > 0 ? (
                  <div className="space-y-4">
                    {(caseRates ?? []).map((r) => (
                      <div key={r.case_type} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{r.case_type}</span>
                          <span className="text-sm text-muted-foreground">{r.success_rate}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className={`${rateBarColor(r.success_rate)} h-2 rounded-full`} style={{ width: `${r.success_rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No data available. Add more case data to see rates.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Predictions (user-scoped) */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-primary" />
                  Recent Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <p className="text-sm text-muted-foreground">Sign in to see your saved predictions.</p>
                ) : draftsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-1 pb-2 border-b border-border">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (myDrafts ?? []).length > 0 ? (
                  <div className="divide-y divide-border">
                    {(myDrafts ?? []).map((draft) => {
                      const prob = draft.success_probability ?? 0;
                      const probColor = prob >= 70 ? "text-legal-success" : prob >= 40 ? "text-legal-warning" : "text-destructive";
                      return (
                        <div key={draft.id} className="flex items-start justify-between gap-2 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{draft.case_type || "Unnamed Case"}</p>
                            <p className="text-xs text-muted-foreground truncate">{draft.jurisdiction || "No jurisdiction"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {draft.success_probability !== null && (
                                <span className={`text-xs font-semibold ${probColor}`}>{draft.success_probability}%</span>
                              )}
                              {draft.confidence_level && (
                                <Badge variant="secondary" className="text-xs py-0 px-1">
                                  {draft.confidence_level.replace(" Confidence", "")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(draft.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                            disabled={deleteMutation.isPending && deleteMutation.variables === draft.id}
                            onClick={() => handleDeleteDraft(draft.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No predictions yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Key Reasons sidebar — only after a prediction run */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Key Reasons
                </CardTitle>
                <CardDescription className="text-white/80">
                  {prediction ? "From your latest analysis" : "Run a prediction to see why"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {prediction && prediction.ai_insights.length > 0 ? (
                  <div className="space-y-3">
                    {prediction.ai_insights.slice(0, 4).map((insight, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/85 leading-relaxed">
                    Enter your case details and run a prediction. You will get a success estimate,
                    a proceed or caution recommendation, and plain-language reasons based on similar past cases.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAI;
