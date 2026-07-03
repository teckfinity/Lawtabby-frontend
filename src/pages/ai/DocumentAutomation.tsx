import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FileCheck,
  Wand2,
  FileText,
  Download,
  Copy,
  Settings,
  FileX,
  Clock,
  CheckCircle,
  Edit3,
  Zap,
  Bot,
  Eye,
  Folder,
  Search,
  Loader2,
  AlertCircle,
  FolderOpen,
  Printer,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LibraryPickerDialog } from "@/components/library/LibraryPickerDialog";
import type { LibraryDocument } from "@/api/ai-features/document-library";
import type { AutomationDocument, AutomationJob, AutomationTemplate } from "@/api/ai-features/document-automation";
import { fetchAutomationDocument } from "@/api/ai-features/document-automation";
import {
  handleAutomationDownload,
  useAutomationDocuments,
  useAutomationGenerate,
  useAutomationSettings,
  useAutomationSettingsUpdate,
  useAutomationStats,
  useAutomationTemplates,
  useAutomationUpdateDocument,
} from "@/api/hooks/useDocumentAutomation";
import { formatLegalDocumentHtml, formatRagSourceMeta, humanizeFieldName } from "@/lib/legalDocumentFormat";

const INITIAL_TEMPLATE_VISIBLE = 6;

const ICON_MAP: Record<string, typeof FileText> = {
  "file-text": FileText,
  edit: Edit3,
  "file-check": FileCheck,
  "file-x": FileX,
};

const COLOR_MAP: Record<string, string> = {
  "legal-primary": "bg-legal-primary",
  "legal-info": "bg-legal-info",
  "legal-warning": "bg-legal-warning",
  "legal-success": "bg-legal-success",
};

const EMPTY_FORM = {
  client_name: "",
  opposing_party: "",
  matter_type: "",
  document_type: "",
  urgency: "",
  issue: "",
  amount: "",
  evidence_summary: "",
  key_details: "",
  document_goal: "",
};

function TemplateIcon({ template }: { template: AutomationTemplate }) {
  const Icon = ICON_MAP[template.icon_key] || FileText;
  const color = COLOR_MAP[template.color_key] || "bg-legal-primary";
  return (
    <div className={`p-2 ${color} rounded-lg`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
  );
}

function formatUsage(used: number, limit: number | null) {
  if (limit == null) return `${used} used · Unlimited plan`;
  return `${used}/${limit} generations this month`;
}

const DocumentAutomation = () => {
  const navigate = useNavigate();
  const templatesQuery = useAutomationTemplates();
  const statsQuery = useAutomationStats();
  const documentsQuery = useAutomationDocuments();
  const settingsQuery = useAutomationSettings();
  const generateMutation = useAutomationGenerate();
  const updateMutation = useAutomationUpdateDocument();
  const settingsMutation = useAutomationSettingsUpdate();

  const templates = templatesQuery.data ?? [];
  const recentDocs = documentsQuery.data?.results ?? [];
  const stats = statsQuery.data;

  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [templateConfigOpen, setTemplateConfigOpen] = useState(false);
  const [viewAllDocsOpen, setViewAllDocsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [viewDocSearch, setViewDocSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [visibleTemplateCount, setVisibleTemplateCount] = useState(INITIAL_TEMPLATE_VISIBLE);
  const [generatorTab, setGeneratorTab] = useState("form");
  const generatedOutputRef = useRef<HTMLDivElement>(null);

  const [formInput, setFormInput] = useState({ ...EMPTY_FORM });
  const [modalInput, setModalInput] = useState({ ...EMPTY_FORM });
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>([]);
  const [modalLibraryDocs, setModalLibraryDocs] = useState<LibraryDocument[]>([]);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState("legal-memo");

  const [generatedDocs, setGeneratedDocs] = useState<AutomationDocument[]>([]);
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [generationMs, setGenerationMs] = useState(0);
  const [ragUsed, setRagUsed] = useState(false);
  const [ragSources, setRagSources] = useState<AutomationJob["rag_sources"]>([]);
  const [editContent, setEditContent] = useState("");

  const [settingsForm, setSettingsForm] = useState({
    auto_save_to_library: true,
    default_tone: "formal" as "formal" | "assertive" | "neutral",
    jurisdiction: "",
    include_disclaimer: true,
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettingsForm(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  useEffect(() => {
    if (templates.length && !templates.find((t) => t.slug === selectedTemplateSlug)) {
      setSelectedTemplateSlug(templates[0].slug);
    }
  }, [templates, selectedTemplateSlug]);

  const activeDoc = generatedDocs[activeDocIndex] ?? null;
  const isGenerating = generateMutation.isPending;
  const usage = stats?.usage;
  const blocked =
    usage?.limit != null && (usage.limit === 0 || usage.used >= usage.limit);
  const atLimit = usage?.limit != null && usage.limit === 0;
  const nearLimit =
    usage?.limit != null && usage.limit > 0 && usage.used >= usage.limit;

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
    );
  }, [templates, templateSearch]);

  const visibleTemplates = filteredTemplates.slice(0, visibleTemplateCount);

  const scrollToGenerated = () => {
    requestAnimationFrame(() => {
      generatedOutputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const filteredViewDocs = useMemo(() => {
    const q = viewDocSearch.trim().toLowerCase();
    if (!q) return recentDocs;
    return recentDocs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.template_name.toLowerCase().includes(q) ||
        d.template_category.toLowerCase().includes(q)
    );
  }, [recentDocs, viewDocSearch]);

  const statCards = [
    {
      label: "Documents Generated",
      value: stats ? String(stats.documents_generated) : "N/A",
      icon: FileText,
    },
    {
      label: "Time Saved",
      value: stats ? `${stats.time_saved_hours} hrs` : "N/A",
      icon: Clock,
    },
    {
      label: "Templates Available",
      value: stats ? String(stats.templates_available) : "N/A",
      icon: FileX,
    },
    {
      label: "Plan Usage",
      value: usage ? (usage.limit == null ? "Unlimited" : `${usage.used}/${usage.limit}`) : "N/A",
      icon: CheckCircle,
    },
  ];

  const setFormField = (field: string, value: string, modal = false) => {
    if (modal) {
      setModalInput((prev) => ({ ...prev, [field]: value }));
    } else {
      setFormInput((prev) => ({ ...prev, [field]: value }));
    }
  };

  const buildPayload = (
    templateSlug: string,
    input: typeof EMPTY_FORM,
    libDocs: LibraryDocument[]
  ) => ({
    template_slug: templateSlug,
    input: Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, value ?? ""])
    ),
    library_document_ids: libDocs.map((d) => d.id),
  });

  const runGenerate = async (
    templateSlug: string,
    input: typeof EMPTY_FORM,
    libDocs: LibraryDocument[]
  ) => {
    const job = await generateMutation.mutateAsync(buildPayload(templateSlug, input, libDocs));
    setGeneratedDocs(job.documents);
    setActiveDocIndex(0);
    setGenerationMs(job.generation_ms);
    setRagUsed(job.rag_used);
    setRagSources(job.rag_sources || []);
    scrollToGenerated();
  };

  const handleTemplateSelect = (template: AutomationTemplate) => {
    const base: Record<string, string> = { ...EMPTY_FORM };
    template.required_fields?.forEach((field) => {
      if (!(field in base)) base[field] = "";
    });
    setSelectedTemplate(template);
    setModalInput({ ...base, matter_type: template.category });
    setModalLibraryDocs([]);
    setTemplateConfigOpen(true);
  };

  const handleQuickAction = (label: string) => {
    const slugMap: Record<string, string> = {
      "Legal Memo": "legal-memo",
      "Contract Review": "contract-agreement",
      "Discovery Request": "discovery-request",
      "Motion Draft": "motion-to-dismiss",
    };
    const slug = slugMap[label];
    const template = templates.find((t) => t.slug === slug);
    if (template) handleTemplateSelect(template);
  };

  const handleGenerate = () => {
    runGenerate(selectedTemplateSlug, formInput, libraryDocs);
  };

  const handleModalGenerate = () => {
    if (!selectedTemplate) return;
    setTemplateConfigOpen(false);
    runGenerate(selectedTemplate.slug, modalInput, modalLibraryDocs);
  };

  const handleCopy = async () => {
    if (!activeDoc?.content) return;
    await navigator.clipboard.writeText(activeDoc.content);
    toast.success("Copied to clipboard.");
  };

  const openEdit = () => {
    if (!activeDoc) return;
    setEditContent(activeDoc.content || "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!activeDoc) return;
    const updated = await updateMutation.mutateAsync({
      id: activeDoc.id,
      content: editContent,
    });
    setGeneratedDocs((prev) =>
      prev.map((d, i) => (i === activeDocIndex ? { ...d, ...updated } : d))
    );
    setEditOpen(false);
  };

  const viewDocument = async (doc: AutomationDocument) => {
    try {
      const full = await fetchAutomationDocument(doc.id);
      setGeneratedDocs([full]);
      setActiveDocIndex(0);
      setViewAllDocsOpen(false);
      scrollToGenerated();
    } catch {
      // toast handled by API layer if needed
    }
  };

  const renderField = (
    field: string,
    input: typeof EMPTY_FORM,
    modal: boolean
  ) => {
    const labels: Record<string, string> = {
      client_name: "Client Name",
      opposing_party: "Opposing Party",
      matter_type: "Matter Type",
      document_type: "Document Type",
      urgency: "Urgency",
      issue: "Issue",
      amount: "Amount at Issue",
      evidence_summary: "Evidence Summary",
      key_details: "Key Details & Requirements",
    };
    const placeholders: Record<string, string> = {
      client_name: "Enter client name",
      opposing_party: "Enter opposing party name",
      matter_type: "e.g., Employment, Contract Dispute",
      document_type: "e.g., Legal Memo, Contract",
      urgency: "e.g., Standard, Urgent",
      issue: "Describe the legal issue",
      amount: "e.g., $42,000",
      evidence_summary: "Signed contract, invoices, emails…",
      key_details: "Provide specific details and requirements…",
      document_goal: "e.g., Demand letter for unpaid invoice, NDA for vendor",
    };

    const label = labels[field] || humanizeFieldName(field);
    const placeholder = placeholders[field] || `Enter ${humanizeFieldName(field).toLowerCase()}`;

    if (field === "key_details" || field === "evidence_summary" || field === "document_goal") {
      return (
        <div key={field}>
          <Label htmlFor={`${modal ? "modal-" : ""}${field}`}>{label}</Label>
          <Textarea
            id={`${modal ? "modal-" : ""}${field}`}
            value={(input as Record<string, string>)[field] || ""}
            onChange={(e) => setFormField(field, e.target.value, modal)}
            placeholder={placeholder}
            className="min-h-[100px] resize-none mt-2"
          />
        </div>
      );
    }

    return (
      <div key={field}>
        <Label htmlFor={`${modal ? "modal-" : ""}${field}`}>{label}</Label>
        <Input
          id={`${modal ? "modal-" : ""}${field}`}
          value={(input as Record<string, string>)[field] || ""}
          onChange={(e) => setFormField(field, e.target.value, modal)}
          placeholder={placeholder}
          className="mt-2"
        />
      </div>
    );
  };

  const templateFields = (template: AutomationTemplate | null, modal: boolean) => {
    const fields = template?.required_fields?.length
      ? template.required_fields
      : ["client_name", "matter_type", "key_details"];
    const input = modal ? modalInput : formInput;
    const longFields = new Set(["key_details", "evidence_summary", "document_goal"]);
    const shortFields = fields.filter((f) => !longFields.has(f));
    const textareaFields = fields.filter((f) => longFields.has(f));

    return (
      <div className="space-y-4">
        {shortFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortFields.map((f) => renderField(f, input, modal))}
          </div>
        )}
        {textareaFields.map((f) => renderField(f, input, modal))}
      </div>
    );
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-legal-info rounded-lg">
              <FileCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Document Automation</h1>
              <p className="text-muted-foreground">
                AI-powered legal document generation and template automation
              </p>
              {usage && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatUsage(usage.used, usage.limit)}
                </p>
              )}
            </div>
          </div>

          {(atLimit || nearLimit) && (
            <Card className="mb-4 border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {atLimit
                      ? "Document Automation is not included in your plan."
                      : "You have used your monthly automation allowance."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upgrade to Professional or higher to generate legal documents with AI.
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate("/subscription")}>
                  View Plans
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => (
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileX className="h-5 w-5 text-legal-primary" />
                  Document Templates
                </CardTitle>
                <CardDescription>
                  Choose from professional legal document templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates by name, category, or keyword…"
                    value={templateSearch}
                    onChange={(e) => {
                      setTemplateSearch(e.target.value);
                      setVisibleTemplateCount(INITIAL_TEMPLATE_VISIBLE);
                    }}
                    className="pl-9"
                  />
                </div>
                {templatesQuery.isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading templates…
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No templates match your search.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="border border-border rounded-lg p-4 hover:shadow-legal transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <TemplateIcon template={template} />
                          <Badge variant="secondary" className="text-xs">
                            {template.use_count} uses
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1 group-hover:text-legal-primary transition-colors">
                          {template.name}
                          {template.is_bundle && (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              Bundle
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <Button
                            size="sm"
                            className="bg-legal-primary hover:bg-legal-primary/90"
                            onClick={() => handleTemplateSelect(template)}
                            disabled={blocked}
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                    </div>
                    {visibleTemplateCount < filteredTemplates.length && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() =>
                          setVisibleTemplateCount((n) => n + INITIAL_TEMPLATE_VISIBLE)
                        }
                      >
                        Load more templates ({filteredTemplates.length - visibleTemplateCount}{" "}
                        remaining)
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-legal-primary" />
                  AI Document Generator
                </CardTitle>
                <CardDescription>
                  Provide details to generate customized legal documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={generatorTab} onValueChange={setGeneratorTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="form">Form Input</TabsTrigger>
                    <TabsTrigger value="chat">AI Chat Mode</TabsTrigger>
                  </TabsList>

                  <TabsContent value="form" className="mt-6 space-y-4">
                    <div>
                      <Label>Template</Label>
                      <Select value={selectedTemplateSlug} onValueChange={setSelectedTemplateSlug}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((t) => (
                            <SelectItem key={t.slug} value={t.slug}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {templateFields(
                      templates.find((t) => t.slug === selectedTemplateSlug) ?? null,
                      false
                    )}

                    <div>
                      <Label>Evidence from Library (optional)</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setLibraryPickerOpen(true)}
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Pick from Library
                        </Button>
                        {libraryDocs.map((doc) => (
                          <Badge key={doc.id} variant="secondary" className="gap-1">
                            {doc.original_filename}
                            <button
                              type="button"
                              className="ml-1 hover:text-destructive"
                              onClick={() =>
                                setLibraryDocs((prev) => prev.filter((d) => d.id !== doc.id))
                              }
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleGenerate}
                        className="flex-1 bg-legal-primary hover:bg-legal-primary/90"
                        disabled={isGenerating || blocked}
                      >
                        {isGenerating ? (
                          <>
                            <Zap className="h-4 w-4 mr-2 animate-spin" />
                            Generating…
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Generate Document
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="mt-6">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">AI-Powered Document Creation</h3>
                      <p className="text-muted-foreground mb-4">
                        Use AI Chat for conversational drafting, then refine with templates here.
                      </p>
                      <Button asChild className="bg-legal-primary hover:bg-legal-primary/90">
                        <Link to="/chat">Open AI Chat</Link>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {generatorTab === "form" && (generatedDocs.length > 0 || isGenerating) && (
              <div ref={generatedOutputRef} className="scroll-mt-24 mt-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-legal-success" />
                      Generated Document
                    </div>
                    {activeDoc && !isGenerating && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleCopy}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAutomationDownload(activeDoc.id, "txt")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.print()}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={openEdit}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    AI-generated draft for attorney review — not legal advice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-legal-primary" />
                      <h3 className="text-lg font-semibold mb-2">Generating Document</h3>
                      <p className="text-muted-foreground">
                        Our AI is drafting your legal document…
                      </p>
                    </div>
                  ) : activeDoc ? (
                    <div className="space-y-4">
                      {generatedDocs.length > 1 && (
                        <Tabs
                          value={String(activeDocIndex)}
                          onValueChange={(v) => setActiveDocIndex(Number(v))}
                        >
                          <TabsList>
                            {generatedDocs.map((doc, idx) => (
                              <TabsTrigger key={doc.id} value={String(idx)}>
                                {doc.title.split(" - ")[0]}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      )}

                      <div className="bg-gradient-primary rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Document Generated Successfully</span>
                        </div>
                        <p className="text-sm opacity-90">{activeDoc.title}</p>
                      </div>

                      <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
                        <div
                          className="legal-document-preview font-serif text-foreground text-[15px] leading-7 [&_.legal-doc-heading]:font-heading [&_.legal-doc-heading]:font-semibold [&_.legal-doc-heading]:text-gold-dark [&_.legal-doc-title]:text-lg [&_.legal-doc-title]:mt-2 [&_.legal-doc-title]:mb-4 [&_.legal-doc-section]:text-base [&_.legal-doc-section]:mt-6 [&_.legal-doc-section]:mb-2 [&_.legal-doc-paragraph]:mb-3 [&_.legal-doc-list]:list-disc [&_.legal-doc-list]:pl-6 [&_.legal-doc-list]:space-y-1"
                          dangerouslySetInnerHTML={{
                            __html: formatLegalDocumentHtml(activeDoc.content || ""),
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>Generated in {(generationMs / 1000).toFixed(1)}s</span>
                        <span>•</span>
                        <span>Word count: {activeDoc.word_count}</span>
                        <span>•</span>
                        <span>
                          {ragUsed
                            ? `${ragSources.length} supporting case${ragSources.length === 1 ? "" : "s"} cited`
                            : "No matching case law in library"}
                        </span>
                        {activeDoc.library_document_id && (
                          <>
                            <span>•</span>
                            <Link
                              to="/library/downloaded"
                              className="text-legal-primary hover:underline"
                            >
                              Saved to Library
                            </Link>
                          </>
                        )}
                      </div>

                      {ragUsed && ragSources.length > 0 && (
                        <div className="rounded-lg border border-border bg-cream-dark/60 p-4 space-y-3">
                          <p className="font-semibold text-sm text-foreground">Supporting case law</p>
                          <ul className="space-y-2 text-sm">
                            {ragSources.map((src, idx) => {
                              const meta = formatRagSourceMeta(src);
                              return (
                                <li key={`${src.title}-${idx}`}>
                                  {src.url ? (
                                    <a
                                      href={src.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-gold-dark hover:text-gold hover:underline"
                                    >
                                      {src.title}
                                    </a>
                                  ) : (
                                    <span className="font-medium text-foreground">{src.title}</span>
                                  )}
                                  {meta ? (
                                    <span className="text-muted-foreground"> · {meta}</span>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          className="flex-1"
                          onClick={() => handleAutomationDownload(activeDoc.id, "pdf")}
                        >
                          Download as PDF
                        </Button>
                        <Button variant="outline" onClick={openEdit}>
                          Edit Document
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-primary" />
                  Recent Documents
                </CardTitle>
                <CardDescription>Your recently generated documents</CardDescription>
              </CardHeader>
              <CardContent>
                {documentsQuery.isLoading ? (
                  <div className="py-6 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : recentDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No documents yet. Generate your first draft above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentDocs.slice(0, 3).map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-medium text-sm leading-tight truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.template_category} • {doc.relative_time || doc.date_display}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => viewDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Download PDF"
                            onClick={() =>
                              handleAutomationDownload(
                                doc.id,
                                "pdf",
                                `${doc.doc_type || "document"}.pdf`
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setViewAllDocsOpen(true)}
                  disabled={recentDocs.length === 0}
                >
                  View All Documents
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-legal-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common document types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {["Legal Memo", "Contract Review", "Discovery Request", "Motion Draft"].map(
                  (label) => (
                    <Button
                      key={label}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleQuickAction(label)}
                      disabled={blocked}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {label}
                    </Button>
                  )
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Features
                </CardTitle>
                <CardDescription className="text-white/80">
                  Included with Document Automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {[
                    "Professional template library",
                    "Multi-document bundles",
                    "Library evidence attachment",
                    "Auto-save to Downloaded library",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={templateConfigOpen} onOpenChange={setTemplateConfigOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTemplate && <TemplateIcon template={selectedTemplate} />}
                Configure {selectedTemplate?.name}
              </DialogTitle>
              <DialogDescription>
                Customize the template parameters before generation
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                {templateFields(selectedTemplate, true)}
                <div>
                  <Label>Evidence from Library (optional)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLibraryPickerOpen(true)}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Pick from Library
                    </Button>
                    {modalLibraryDocs.map((doc) => (
                      <Badge key={doc.id} variant="secondary">
                        {doc.original_filename}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setTemplateConfigOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleModalGenerate}
                    className="bg-legal-primary hover:bg-legal-primary/90"
                    disabled={isGenerating || blocked}
                  >
                    Generate Document
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={viewAllDocsOpen} onOpenChange={setViewAllDocsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-legal-primary" />
                All Documents
              </DialogTitle>
              <DialogDescription>Manage your generated legal documents</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents…"
                  className="pl-9"
                  value={viewDocSearch}
                  onChange={(e) => setViewDocSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredViewDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-8 w-8 text-legal-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.template_category} • {doc.relative_time || doc.date_display} •{" "}
                            {doc.size_display}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={doc.status === "completed" ? "default" : "secondary"}>
                          {doc.status}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => viewDocument(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Download PDF"
                          onClick={() =>
                            handleAutomationDownload(doc.id, "pdf", `${doc.doc_type || "document"}.pdf`)
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredViewDocs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No documents found.</p>
                  )}
                </div>
              </ScrollArea>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setViewAllDocsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-legal-primary" />
                Automation Settings
              </DialogTitle>
              <DialogDescription>
                Preferences apply to all future document generations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-save to Library</Label>
                  <p className="text-sm text-muted-foreground">
                    Save generated documents to Downloaded library. On by default for new accounts;
                    change here anytime.
                  </p>
                </div>
                <Switch
                  checked={settingsForm.auto_save_to_library}
                  onCheckedChange={(v) =>
                    setSettingsForm((s) => ({ ...s, auto_save_to_library: v }))
                  }
                />
              </div>
              <div>
                <Label>Default tone</Label>
                <Select
                  value={settingsForm.default_tone}
                  onValueChange={(v) =>
                    setSettingsForm((s) => ({
                      ...s,
                      default_tone: v as typeof settingsForm.default_tone,
                    }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="assertive">Assertive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jurisdiction (optional)</Label>
                <Input
                  className="mt-2"
                  placeholder="e.g., California, US Federal"
                  value={settingsForm.jurisdiction}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, jurisdiction: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Include review disclaimer</Label>
                  <p className="text-sm text-muted-foreground">
                    Add attorney-review footer to drafts
                  </p>
                </div>
                <Switch
                  checked={settingsForm.include_disclaimer}
                  onCheckedChange={(v) =>
                    setSettingsForm((s) => ({ ...s, include_disclaimer: v }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  settingsMutation.mutate(settingsForm, {
                    onSuccess: () => setSettingsOpen(false),
                  });
                }}
                className="bg-legal-primary hover:bg-legal-primary/90"
              >
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>Make changes before downloading or sharing</DialogDescription>
            </DialogHeader>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <LibraryPickerDialog
          open={libraryPickerOpen}
          onOpenChange={setLibraryPickerOpen}
          compatibleTypes={["pdf", "docx", "doc", "txt"]}
          onSelect={(doc) => {
            if (templateConfigOpen) {
              setModalLibraryDocs((prev) =>
                prev.some((d) => d.id === doc.id) ? prev : [...prev, doc]
              );
            } else {
              setLibraryDocs((prev) =>
                prev.some((d) => d.id === doc.id) ? prev : [...prev, doc]
              );
            }
            setLibraryPickerOpen(false);
          }}
          description="Attach contracts, invoices, or other evidence for the AI to reference."
        />
      </div>
    </div>
  );
};

export default DocumentAutomation;
