import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Brain, 
  FileText, 
  Upload, 
  Download, 
  Copy, 
  Wand2, 
  Clock, 
  CheckCircle,
  Settings,
  Save,
  Target,
  Zap,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { sendLegalChat } from "@/api/ai/doc_summary";

const DocumentSummarizer = () => {
  const [activeTab, setActiveTab] = useState("document");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullResponse, setFullResponse] = useState<any>(null);

  const [settings, setSettings] = useState({
    outputFormat: "irac" as "irac" | "executive" | "detailed" | "bullet_points",
    summaryLength: [60],
    includeKeyFacts: true,
    includeLegalIssues: true,
    includeHoldings: true,
    includeRecommendations: false,
    confidenceThreshold: [75],
    autoSave: true,
    citationStyle: "bluebook" as "bluebook" | "apa" | "mla" | "chicago",
    language: "english" as "english" | "spanish" | "french" | "german"
  });

  const handleSummarize = async () => {
    if (activeTab === "document" && !file) {
      toast("Please select a file to summarize.");
      return;
    }
    if (activeTab === "text" && !textInput.trim()) {
      toast("Please enter text to summarize.");
      return;
    }

    setIsProcessing(true);
    setSummary("");

    try {
      const response = await sendLegalChat(
        "process",
        activeTab === "document" ? file! : undefined,
        activeTab === "text" ? textInput : undefined,
        settings.outputFormat,
        settings.summaryLength[0],
        settings.confidenceThreshold[0],
        settings.citationStyle,
        settings.language,
        settings.autoSave,
        settings.includeKeyFacts,
        settings.includeLegalIssues,
        settings.includeHoldings,
        settings.includeRecommendations
      );

      const result = response.data;

      if (result.summary) {
        setSummary(result.summary);
      } else {
        setSummary("No summary text found in response!");
      }

      setFullResponse(result);
      toast("Summary generated successfully!");
    } catch (error: any) {
      console.error("API Error:", error);
      toast(error.response?.data?.detail || "Failed to generate summary. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const outputFormats = [
    { value: "irac", label: "IRAC Format", description: "Structured legal analysis following IRAC methodology" },
    { value: "executive", label: "Executive Summary", description: "Brief overview with key points" },
    { value: "detailed", label: "Detailed Analysis", description: "Comprehensive case breakdown" },
    { value: "bullet_points", label: "Bullet Points", description: "Structured list format" }
  ];

  const citationStyles = [
    { value: "bluebook", label: "Bluebook" },
    { value: "apa", label: "APA" },
    { value: "mla", label: "MLA" },
    { value: "chicago", label: "Chicago" }
  ];

  const languages = [
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" }
  ];

  const stats = [
    // { label: "Documents Processed", value: "1,247", icon: FileText },
    // { label: "Time Saved", value: "89 hrs", icon: Clock },
    // { label: "Success Rate", value: "98.4%", icon: CheckCircle },
  ];

  const handleDownload = () => {
    if (!summary) {
      toast("No summary to download!");
      return;
    }

    const blob = new Blob([summary], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "summary.txt";
    link.click();
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast("Summary text copied!");
    } else {
      toast.error("No summary available to copy!");
    }
  };

  const handleSaveSettings = () => {
    toast("Settings saved successfully!");
    setIsSettingsOpen(false);
  };

  const currentOutputFormat = outputFormats.find(f => f.value === settings.outputFormat);

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-legal-primary rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Document Summarizer</h1>
              <p className="text-muted-foreground">AI-powered summaries for legal documents</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-legal-primary" />
                Input Document
              </CardTitle>
              <CardDescription>
                Upload a legal document or paste text for AI-powered summarization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="document">Document Upload</TabsTrigger>
                  <TabsTrigger value="text">Text Input</TabsTrigger>
                </TabsList>

                <TabsContent value="document" className="mt-6">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-legal-primary transition-colors">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Legal Document</h3>
                    <p className="text-muted-foreground mb-4">
                      Drag & drop or click to upload PDF, DOC, or TXT files
                    </p>

                    <Button
                      className="bg-legal-primary hover:bg-legal-primary/90"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const selected = e.target.files?.[0];
                        if (selected) {
                          if (selected.size > 10 * 1024 * 1024) {
                            toast("File size exceeds 10MB limit.");
                            return;
                          }
                          setFile(selected);
                          toast(`Selected: ${selected.name}`);
                        }
                      }}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                    />

                    {file && (
                      <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setFile(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      Max file size: 10MB | Supported: PDF, DOC, DOCX, TXT
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="mt-6">
            <Textarea
  placeholder="Paste your legal document text here for AI analysis and IRAC summarization..."
  className="min-h-[300px] resize-none"
  value={textInput}
  onChange={(e) => setTextInput(e.target.value)}
/>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-muted-foreground">
                      Character count: 0 / 50,000
                    </p>
                    <Badge variant="secondary">IRAC Format</Badge>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleSummarize}
                  className="flex-1 bg-legal-primary hover:bg-legal-primary/90"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-legal-primary" />
                  AI Summary ({currentOutputFormat?.label})
                </div>
                {summary && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {currentOutputFormat?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!summary && !isProcessing && (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Ready for Analysis
                  </h3>
                  <p className="text-muted-foreground">
                    Upload a document or paste text to generate an AI-powered summary
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-legal-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analyzing Document</h3>
                  <p className="text-muted-foreground">
                    Our AI is processing your document and generating a summary...
                  </p>
                </div>
              )}

              {summary && (
                <div className="space-y-4">
                  <div className="bg-gradient-primary rounded-lg p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Analysis Complete</span>
                    </div>
                    <p className="text-sm opacity-90">
                      Document successfully analyzed
                    </p>
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-mono bg-muted/50 rounded-lg p-4 leading-relaxed max-h-[400px] overflow-y-auto">
                      {summary}
                    </pre>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Generated in 2.3s</span>
                    <span>•</span>
                    <span>Confidence: 94%</span>
                    <span>•</span>
                    <span>{settings.outputFormat.toUpperCase()} Compliant</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <Brain className="h-8 w-8 text-legal-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Advanced legal AI trained on thousands of cases
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-legal-info mx-auto mb-3" />
              <h3 className="font-semibold mb-2">IRAC Methodology</h3>
              <p className="text-sm text-muted-foreground">
                Structured analysis following legal writing standards
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-legal-success mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Time Saving</h3>
              <p className="text-sm text-muted-foreground">
                Generate summaries in seconds, not hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Settings Modal */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-legal-primary" />
                Summarizer Settings
              </DialogTitle>
              <DialogDescription>
                Customize your AI document analysis preferences
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Settings */}
              <div className="lg:col-span-2 space-y-6">
                {/* Output Format */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-legal-primary" />
                      Output Format
                    </CardTitle>
                    <CardDescription>
                      Choose how your document summaries are structured
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {outputFormats.map((format) => (
                        <div 
                          key={format.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            settings.outputFormat === format.value 
                              ? 'border-legal-primary bg-legal-primary/5' 
                              : 'border-border hover:border-legal-primary/50'
                          }`}
                          onClick={() => setSettings({...settings, outputFormat: format.value})}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{format.label}</h4>
                            {settings.outputFormat === format.value && (
                              <Badge variant="default">Selected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{format.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Settings */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-legal-primary" />
                      Analysis Settings
                    </CardTitle>
                    <CardDescription>
                      Configure AI analysis parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium">Summary Length</label>
                          <span className="text-sm text-muted-foreground">{settings.summaryLength[0]}%</span>
                        </div>
                        <Slider
                          value={settings.summaryLength}
                          onValueChange={(value) => setSettings({...settings, summaryLength: value})}
                          max={100}
                          min={20}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Brief</span>
                          <span>Detailed</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium">Confidence Threshold</label>
                          <span className="text-sm text-muted-foreground">{settings.confidenceThreshold[0]}%</span>
                        </div>
                        <Slider
                          value={settings.confidenceThreshold}
                          onValueChange={(value) => setSettings({...settings, confidenceThreshold: value})}
                          max={95}
                          min={50}  
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Relaxed</span>
                          <span>Strict</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Inclusions */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-legal-primary" />
                      Content Inclusions
                    </CardTitle>
                    <CardDescription>
                      Select what elements to include in summaries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { key: 'includeKeyFacts', label: 'Key Facts', description: 'Essential factual information' },
                        { key: 'includeLegalIssues', label: 'Legal Issues', description: 'Main legal questions presented' },
                        { key: 'includeHoldings', label: 'Holdings & Rulings', description: 'Court decisions and rationales' },
                        { key: 'includeRecommendations', label: 'Recommendations', description: 'AI-generated strategic advice' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.label}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <Switch
                            checked={settings[item.key]}
                            onCheckedChange={(checked) => setSettings({...settings, [item.key]: checked})}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Settings */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-legal-primary" />
                      Advanced Settings
                    </CardTitle>
                    <CardDescription>
                      Additional configuration options
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Citation Style</label>
                        <Select 
                          value={settings.citationStyle} 
                          onValueChange={(value) => setSettings({...settings, citationStyle: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {citationStyles.map((style) => (
                              <SelectItem key={style.value} value={style.value}>
                                {style.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Language</label>
                        <Select 
                          value={settings.language} 
                          onValueChange={(value) => setSettings({...settings, language: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium">Auto-save Settings</h4>
                          <p className="text-sm text-muted-foreground">Automatically save preferences</p>
                        </div>
                        <Switch
                          checked={settings.autoSave}
                          onCheckedChange={(checked) => setSettings({...settings, autoSave: checked})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview & Actions */}
              <div className="space-y-6">
                {/* Preview */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-legal-primary" />
                      Preview
                    </CardTitle>
                    <CardDescription>
                      Sample output with current settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-sm space-y-2">
                        <h4 className="font-semibold">
                          {settings.outputFormat === 'irac' ? 'CASE SUMMARY - IRAC FORMAT' :
                           settings.outputFormat === 'executive' ? 'EXECUTIVE SUMMARY' :
                           settings.outputFormat === 'detailed' ? 'DETAILED ANALYSIS' :
                           'KEY POINTS SUMMARY'}
                        </h4>
                        
                        {settings.includeKeyFacts && (
                          <div>
                            <strong>Key Facts:</strong> Sample factual overview...
                          </div>
                        )}
                        
                        {settings.includeLegalIssues && (
                          <div>
                            <strong>Legal Issues:</strong> Primary questions presented...
                          </div>
                        )}
                        
                        {settings.includeHoldings && (
                          <div>
                            <strong>Holdings:</strong> Court's decision and reasoning...
                          </div>
                        )}
                        
                        {settings.includeRecommendations && (
                          <div>
                            <strong>Recommendations:</strong> Strategic considerations...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Length: {settings.summaryLength[0]}%</span>
                        <span>Confidence: {settings.confidenceThreshold[0]}%</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Style: {citationStyles.find(s => s.value === settings.citationStyle)?.label}</span>
                        <span>Language: {languages.find(l => l.value === settings.language)?.label}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Impact */}
                <Card className="shadow-card bg-gradient-primary text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Performance Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Processing Speed:</span>
                        <span>{settings.summaryLength[0] > 80 ? 'Slower' : settings.summaryLength[0] > 40 ? 'Normal' : 'Faster'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span>{settings.confidenceThreshold[0] > 80 ? 'High' : 'Standard'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Detail Level:</span>
                        <span>{settings.summaryLength[0] > 70 ? 'Comprehensive' : 'Concise'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleSaveSettings}
                    className="w-full bg-white text-legal-primary hover:bg-white/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSettings({
                      outputFormat: "irac",
                      summaryLength: [60],
                      includeKeyFacts: true,
                      includeLegalIssues: true,
                      includeHoldings: true,
                      includeRecommendations: false,
                      confidenceThreshold: [75],
                      autoSave: true,
                      citationStyle: "bluebook",
                      language: "english"
                    })}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DocumentSummarizer;
