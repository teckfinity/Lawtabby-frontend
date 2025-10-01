import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
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
  Plus,
  Folder,
  Search,
  Filter,
  Printer
} from "lucide-react";

const DocumentAutomation = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewAllDocsOpen, setViewAllDocsOpen] = useState(false);
  const [templateConfigOpen, setTemplateConfigOpen] = useState(false);
  const [quickActionType, setQuickActionType] = useState<string>("");
  const { toast } = useToast();

  const templates = [
    {
      id: 1,
      name: "Contract Agreement",
      description: "Standard service or employment contract",
      category: "Contracts",
      uses: 1247,
      icon: FileText,
      color: "bg-legal-primary"
    },
    {
      id: 2,
      name: "Legal Memo",
      description: "Professional legal memorandum template",
      category: "Memos",
      uses: 892,
      icon: Edit3,
      color: "bg-legal-info"
    },
    {
      id: 3,
      name: "Discovery Request",
      description: "Interrogatories and document requests",
      category: "Discovery",
      uses: 654,
      icon: FileCheck,
      color: "bg-legal-warning"
    },
    {
      id: 4,
      name: "Motion to Dismiss",
      description: "Standard motion to dismiss template",
      category: "Motions",
      uses: 567,
      icon: FileX,
      color: "bg-legal-success"
    }
  ];

  const recentDocs = [
    { id: 1, name: "Employment Contract - TechCorp", type: "Contract", generated: "2 hours ago", status: "Completed", size: "2.4 MB" },
    { id: 2, name: "Discovery Request - Personal Injury", type: "Discovery", generated: "1 day ago", status: "Draft", size: "1.8 MB" },
    { id: 3, name: "Legal Memo - Copyright Infringement", type: "Memo", generated: "3 days ago", status: "Completed", size: "3.1 MB" },
    { id: 4, name: "Motion to Dismiss - Contract Dispute", type: "Motion", generated: "5 days ago", status: "Completed", size: "2.7 MB" },
    { id: 5, name: "NDA Template - Partnership Agreement", type: "Contract", generated: "1 week ago", status: "Completed", size: "1.5 MB" },
    { id: 6, name: "Cease and Desist Letter", type: "Letter", generated: "1 week ago", status: "Draft", size: "1.2 MB" }
  ];

  const stats = [
    { label: "Documents Generated", value: "8,947", icon: FileText },
    { label: "Time Saved", value: "2,340 hrs", icon: Clock },
    { label: "Templates Available", value: "156", icon: FileX },
    { label: "Accuracy Rate", value: "96.2%", icon: CheckCircle }
  ];

  const handleTemplateSelect = (template: typeof templates[0]) => {
    setSelectedTemplate(template);
    setTemplateConfigOpen(true);
  };

  const handleQuickAction = (actionType: string) => {
    setQuickActionType(actionType);
    setIsGenerating(true);
    setTimeout(() => {
      let docContent = "";
      switch (actionType) {
        case "Legal Memo":
          docContent = `LEGAL MEMORANDUM\n\nTO: Client\nFROM: Legal Team\nDATE: ${new Date().toLocaleDateString()}\nRE: ${actionType}\n\n[Generated content for ${actionType}]`;
          break;
        case "Contract Review":
          docContent = `CONTRACT REVIEW SUMMARY\n\nDocument: [Contract Name]\nReviewed By: [Attorney]\nDate: ${new Date().toLocaleDateString()}\n\nEXECUTIVE SUMMARY\n\n[Generated review content]`;
          break;
        case "Discovery Request":
          docContent = `DISCOVERY REQUEST\n\nTO: [Opposing Counsel]\nFROM: [Your Firm]\nDATE: ${new Date().toLocaleDateString()}\n\nINTERROGATORIES\n\n[Generated discovery requests]`;
          break;
        case "Motion Draft":
          docContent = `MOTION TO [SPECIFY]\n\nTO THE HONORABLE COURT:\n\nDATE: ${new Date().toLocaleDateString()}\n\n[Generated motion content]`;
          break;
        default:
          docContent = `Generated document for ${actionType}`;
      }
      setGeneratedDoc(docContent);
      setIsGenerating(false);
      toast({
        title: "Document Generated",
        description: `${actionType} has been generated successfully.`
      });
    }, 2000);
  };

  const handleSettingsSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your automation preferences have been updated."
    });
    setSettingsOpen(false);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedDoc(`
LEGAL MEMORANDUM

TO: [Client Name]
FROM: [Attorney Name]
DATE: ${new Date().toLocaleDateString()}
RE: Analysis of Employment Contract Terms

EXECUTIVE SUMMARY

This memorandum provides an analysis of the proposed employment contract terms and identifies key provisions that require attention.

BACKGROUND

The Client has received an employment offer from [Company Name] and has requested review of the contract terms, specifically focusing on compensation, termination clauses, and intellectual property provisions.

ANALYSIS

1. Compensation Structure
   The proposed salary of $[X] annually appears competitive for the position. However, the bonus structure requires clarification regarding performance metrics and payment timing.

2. Termination Provisions
   The contract includes a 90-day notice period for voluntary termination, which is standard. However, the "for cause" termination language should be narrowed to protect the employee's interests.

3. Intellectual Property Rights
   The IP assignment clause is broadly written and may encompass personal projects. We recommend adding exceptions for pre-existing IP and personal projects unrelated to company business.

RECOMMENDATIONS

1. Negotiate modification of the IP assignment clause
2. Clarify bonus payment terms and performance metrics
3. Add severance provisions for termination without cause
4. Include standard confidentiality exceptions

CONCLUSION

Overall, the contract terms are reasonable but require the modifications outlined above to better protect the Client's interests.

Please contact me if you have any questions regarding this analysis.

[Attorney Signature]
[Attorney Name], Esq.
[Law Firm]
      `);
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
                    <stat.icon className="h-6 w-6 text-legal-info" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Template Selection */}
            <Card className="shadow-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileX className="h-5 w-5 text-legal-primary" />
                  Document Templates
                </CardTitle>
                <CardDescription>
                  Choose from our library of professional legal document templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-border rounded-lg p-4 hover:shadow-legal transition-all cursor-pointer group">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 ${template.color} rounded-lg`}>
                          <template.icon className="h-5 w-5 text-white" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {template.uses} uses
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1 group-hover:text-legal-primary transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        <Button 
                          size="sm" 
                          className="bg-legal-primary hover:bg-legal-primary/90"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document Generator */}
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
                <Tabs defaultValue="form" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="form">Form Input</TabsTrigger>
                    <TabsTrigger value="chat">AI Chat Mode</TabsTrigger>
                  </TabsList>

                  <TabsContent value="form" className="mt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Document Type</label>
                          <Input placeholder="e.g., Legal Memo, Contract" />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Client Name</label>
                          <Input placeholder="Enter client name" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Matter Type</label>
                          <Input placeholder="e.g., Employment, Contract Dispute" />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Urgency</label>
                          <Input placeholder="e.g., Standard, Urgent" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Key Details & Requirements</label>
                        <Textarea 
                          placeholder="Provide specific details, requirements, and context for the document..."
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="mt-6">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">AI-Powered Document Creation</h3>
                      <p className="text-muted-foreground mb-4">
                        Chat with our AI to create complex legal documents through natural conversation
                      </p>
                      <Button className="bg-legal-primary hover:bg-legal-primary/90">
                        Start AI Chat
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex gap-3">
                  <Button 
                    onClick={handleGenerate}
                    className="flex-1 bg-legal-primary hover:bg-legal-primary/90"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
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
              </CardContent>
            </Card>

            {/* Generated Document */}
            {(generatedDoc || isGenerating) && (
              <Card className="shadow-card mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-legal-success" />
                      Generated Document
                    </div>
                    {generatedDoc && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.print()}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    AI-generated legal document ready for review and customization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 border-4 border-legal-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Generating Document</h3>
                      <p className="text-muted-foreground">
                        Our AI is crafting your legal document with professional formatting and language...
                      </p>
                    </div>
                  ) : generatedDoc && (
                    <div className="space-y-4">
                      <div className="bg-gradient-primary rounded-lg p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Document Generated Successfully</span>
                        </div>
                        <p className="text-sm opacity-90">
                          Professional legal memorandum ready for review and customization
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                          {generatedDoc}
                        </pre>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Generated in 2.8s</span>
                        <span>•</span>
                        <span>Word count: 342</span>
                        <span>•</span>
                        <span>Professionally formatted</span>
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1">
                          Download as PDF
                        </Button>
                        <Button variant="outline">
                          Edit Document
                        </Button>
                        <Button variant="outline">
                          Save Template
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
            {/* Recent Documents */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-primary" />
                  Recent Documents
                </CardTitle>
                <CardDescription>
                  Your recently generated documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDocs.slice(0, 3).map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-sm leading-tight">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.type} • {doc.generated}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => window.print()}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setViewAllDocsOpen(true)}
                >
                  View All Documents
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-legal-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common document types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleQuickAction("Legal Memo")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Legal Memo
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleQuickAction("Contract Review")}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Contract Review
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleQuickAction("Discovery Request")}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Discovery Request
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleQuickAction("Motion Draft")}
                >
                  <FileX className="h-4 w-4 mr-2" />
                  Motion Draft
                </Button>
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Features
                </CardTitle>
                <CardDescription className="text-white/80">
                  Advanced automation capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Smart template selection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Professional formatting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Legal language optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Compliance checking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Template Configuration Modal */}
        <Dialog open={templateConfigOpen} onOpenChange={setTemplateConfigOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTemplate && <selectedTemplate.icon className="h-5 w-5 text-legal-primary" />}
                Configure {selectedTemplate?.name}
              </DialogTitle>
              <DialogDescription>
                Customize the template parameters before generation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input id="client-name" placeholder="Enter client name" />
                </div>
                <div>
                  <Label htmlFor="matter-type">Matter Type</Label>
                  <Input id="matter-type" placeholder="Enter matter type" />
                </div>
              </div>
              <div>
                <Label htmlFor="template-details">Specific Requirements</Label>
                <Textarea 
                  id="template-details"
                  placeholder="Enter specific details for this template..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTemplateConfigOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setTemplateConfigOpen(false);
                    handleGenerate();
                  }}
                  className="bg-legal-primary hover:bg-legal-primary/90"
                >
                  Generate Document
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View All Documents Modal */}
        <Dialog open={viewAllDocsOpen} onOpenChange={setViewAllDocsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-legal-primary" />
                All Documents
              </DialogTitle>
              <DialogDescription>
                Manage your generated legal documents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search documents..." className="pl-9" />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {recentDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-legal-primary" />
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{doc.generated}</span>
                            <span>•</span>
                            <span>{doc.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.status === "Completed" ? "default" : "secondary"}>
                          {doc.status}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => window.print()}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex justify-between">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
                <Button variant="outline" onClick={() => setViewAllDocsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-legal-primary" />
                Automation Settings
              </DialogTitle>
              <DialogDescription>
                Configure your document automation preferences
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="ai">AI Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-save">Auto-save documents</Label>
                      <p className="text-sm text-muted-foreground">Automatically save generated documents</p>
                    </div>
                    <Switch id="auto-save" defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Email notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email when documents are ready</p>
                    </div>
                    <Switch id="notifications" />
                  </div>
                  <Separator />
                  <div>
                    <Label htmlFor="default-format">Default export format</Label>
                    <Select defaultValue="pdf">
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="docx">Word (.docx)</SelectItem>
                        <SelectItem value="txt">Plain Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-library">Template Library Source</Label>
                    <Select defaultValue="standard">
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Library</SelectItem>
                        <SelectItem value="custom">Custom Templates Only</SelectItem>
                        <SelectItem value="both">Both Standard & Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="template-updates">Auto-update templates</Label>
                      <p className="text-sm text-muted-foreground">Keep templates updated automatically</p>
                    </div>
                    <Switch id="template-updates" defaultChecked />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ai" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-complexity">AI Complexity Level</Label>
                    <Select defaultValue="balanced">
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple - Fast generation</SelectItem>
                        <SelectItem value="balanced">Balanced - Good quality & speed</SelectItem>
                        <SelectItem value="complex">Complex - Highest quality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="legal-review">Enable legal review suggestions</Label>
                      <p className="text-sm text-muted-foreground">AI will suggest legal improvements</p>
                    </div>
                    <Switch id="legal-review" defaultChecked />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSettingsSave} className="bg-legal-primary hover:bg-legal-primary/90">
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DocumentAutomation;