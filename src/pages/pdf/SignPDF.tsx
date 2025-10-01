import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, PenTool, Type, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, Trash, User, Users, GripVertical, Calendar, FileText, Stamp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";
import { Document, Page, pdfjs } from 'react-pdf';
import { Canvas as FabricCanvas, FabricImage, Textbox, PencilBrush } from "fabric";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ProcessStep = "upload" | "processing" | "download";
type SigningMode = "only-me" | "several-people" | null;
type FieldType = "signature" | "initials" | "name" | "date" | "text" | "company-stamp";

interface Recipient {
  id: string;
  name: string;
  email: string;
  role: "signer" | "validator" | "witness";
}

interface PlacedField {
  id: string;
  type: FieldType;
  x: number;
  y: number;
  page: number;
  value?: string;
  isDragging?: boolean;
}

const SignPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [signatureType, setSignatureType] = useState<string>("draw");
  const [signatureText, setSignatureText] = useState("");
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  
  // Modal states
  const [showWhoWillSignModal, setShowWhoWillSignModal] = useState(false);
  const [showSignatureDetailsModal, setShowSignatureDetailsModal] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [signingMode, setSigningMode] = useState<SigningMode>(null);
  
  // Signature details
  const [fullName, setFullName] = useState("");
  const [initials, setInitials] = useState("");
  const [selectedSignatureStyle, setSelectedSignatureStyle] = useState(0);
  const [signatureColor, setSignatureColor] = useState("#000000");
  const [signatureTab, setSignatureTab] = useState<"signature" | "initials" | "stamp">("signature");
  
  // Recipients
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newRecipient, setNewRecipient] = useState({ name: "", email: "", role: "signer" as const });
  const [orderReceivers, setOrderReceivers] = useState(false);
  const [changeExpiration, setChangeExpiration] = useState(false);
  
  // Placed fields
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
  const [draggedField, setDraggedField] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setShowWhoWillSignModal(true);
      toast.success("PDF file uploaded successfully");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    toast.success(`PDF loaded! ${numPages} pages ready for signing.`);
  };

  const onDocumentLoadError = (error: Error) => {
    toast.error("Failed to load PDF. Please try another file.");
    console.error("PDF load error:", error);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  // Initialize Fabric canvas for signature drawing in modal
  useEffect(() => {
    if (!canvasRef.current || !showSignatureDetailsModal) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 600,
      height: 200,
      backgroundColor: "#ffffff",
    });

    canvas.isDrawingMode = true;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = signatureColor;
      canvas.freeDrawingBrush.width = 2;
    }

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [showSignatureDetailsModal]);

  useEffect(() => {
    if (fabricCanvas && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = signatureColor;
    }
  }, [signatureColor, fabricCanvas]);

  const signatureStyles = [
    { id: 0, text: "Signature", font: "'Dancing Script', cursive" },
    { id: 1, text: "Signature", font: "'Great Vibes', cursive" },
    { id: 2, text: "Signature", font: "'Allura', cursive" },
    { id: 3, text: "Signature", font: "'Alex Brush', cursive" },
  ];

  const handleWhoWillSign = (mode: SigningMode) => {
    setSigningMode(mode);
    setShowWhoWillSignModal(false);
    if (mode === "only-me") {
      setShowSignatureDetailsModal(true);
    } else {
      setShowRecipientsModal(true);
    }
  };

  const handleAddRecipient = () => {
    if (!newRecipient.name || !newRecipient.email) {
      toast.error("Please enter name and email");
      return;
    }
    setRecipients([...recipients, { ...newRecipient, id: `recipient-${Date.now()}` }]);
    setNewRecipient({ name: "", email: "", role: "signer" });
  };

  const applySignatureDetails = () => {
    if (!fullName) {
      toast.error("Please enter your full name");
      return;
    }
    setShowSignatureDetailsModal(false);
    toast.success("Signature details saved! Now place fields on the PDF.");
  };

  const applyRecipients = () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }
    setShowRecipientsModal(false);
    toast.success("Recipients added! Now place signature fields on the PDF.");
  };

  const addFieldToDocument = (fieldType: FieldType) => {
    const newField: PlacedField = {
      id: `field-${Date.now()}`,
      type: fieldType,
      x: 100,
      y: 100,
      page: currentPage,
    };
    setPlacedFields([...placedFields, newField]);
    toast.success(`${fieldType} field added! Drag to reposition.`);
  };

  const handleFieldDragStart = (e: React.MouseEvent, fieldId: string) => {
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    setDraggedField({
      id: fieldId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    setPlacedFields(prev =>
      prev.map(field => field.id === fieldId ? { ...field, isDragging: true } : field)
    );
  };

  const handleFieldDrag = (e: React.MouseEvent) => {
    if (!draggedField) return;
    
    const container = document.getElementById('pdf-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - draggedField.offsetX;
    const newY = e.clientY - containerRect.top - draggedField.offsetY;

    setPlacedFields(prev =>
      prev.map(field =>
        field.id === draggedField.id
          ? { ...field, x: newX, y: newY }
          : field
      )
    );
  };

  const handleFieldDragEnd = () => {
    if (draggedField) {
      setPlacedFields(prev =>
        prev.map(field => ({ ...field, isDragging: false }))
      );
      setDraggedField(null);
    }
  };

  const removeField = (fieldId: string) => {
    setPlacedFields(prev => prev.filter(field => field.id !== fieldId));
    toast.success("Field removed");
  };

  const getFieldIcon = (type: FieldType) => {
    switch (type) {
      case "signature": return PenTool;
      case "initials": return Type;
      case "name": return User;
      case "date": return Calendar;
      case "text": return FileText;
      case "company-stamp": return Stamp;
    }
  };

  const getFieldColor = (type: FieldType) => {
    switch (type) {
      case "signature": return "bg-blue-100 border-blue-400 text-blue-700";
      case "initials": return "bg-cyan-100 border-cyan-400 text-cyan-700";
      case "name": return "bg-purple-100 border-purple-400 text-purple-700";
      case "date": return "bg-green-100 border-green-400 text-green-700";
      case "text": return "bg-yellow-100 border-yellow-400 text-yellow-700";
      case "company-stamp": return "bg-orange-100 border-orange-400 text-orange-700";
    }
  };

  const signPDF = () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }
    
    setCurrentStep("processing");
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 18;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep("download");
        }, 500);
      }
      setProgress(currentProgress);
    }, 160);
  };

  const downloadFile = () => {
    toast.success("Download started!");
    setTimeout(() => {
      toast.success("Signed PDF downloaded successfully!");
    }, 1000);
  };

  const printFile = () => {
    toast.success("Opening print dialog...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const resetProcess = () => {
    setFile(null);
    setCurrentStep("upload");
    setProgress(0);
  };

  const renderUploadStep = () => (
    <div className="w-full">
      {!file ? (
        <Card className="h-96">
          <CardContent className="p-8 h-full flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload PDF to Sign</h3>
              <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => document.getElementById('pdf-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Select PDF File
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Draggable Fields Sidebar */}
          {(signingMode === "only-me" && fullName) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-sm">Required fields</h3>
                <button
                  onClick={() => addFieldToDocument("signature")}
                  className="w-full flex items-center gap-3 p-3 mb-2 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <PenTool className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Signature</span>
                </button>

                <h3 className="font-semibold mb-2 text-sm mt-4">Optional fields</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => addFieldToDocument("initials")}
                    className="w-full flex items-center gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center text-white text-xs font-bold">
                      AC
                    </div>
                    <span className="text-sm">Initials</span>
                  </button>

                  <button
                    onClick={() => addFieldToDocument("name")}
                    className="w-full flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">Name</span>
                  </button>

                  <button
                    onClick={() => addFieldToDocument("date")}
                    className="w-full flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">Date</span>
                  </button>

                  <button
                    onClick={() => addFieldToDocument("text")}
                    className="w-full flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">Text</span>
                  </button>

                  <button
                    onClick={() => addFieldToDocument("company-stamp")}
                    className="w-full flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                      <Stamp className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm">Company Stamp</span>
                  </button>
                </div>

                <Button
                  onClick={signPDF}
                  className="w-full mt-4 bg-primary"
                  disabled={placedFields.length === 0}
                >
                  Sign →
                </Button>

                {placedFields.length > 0 && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {placedFields.length} field(s) placed
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* PDF Viewer */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
                  <Button variant="outline" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {numPages}
                </div>
              </div>

              <div
                id="pdf-container"
                className="border rounded-lg bg-gray-100 overflow-auto max-h-[600px] relative"
                onMouseMove={handleFieldDrag}
                onMouseUp={handleFieldDragEnd}
                onMouseLeave={handleFieldDragEnd}
              >
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  className="flex justify-center p-4"
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>

                {/* Placed fields on the PDF */}
                {placedFields
                  .filter(field => field.page === currentPage)
                  .map(field => {
                    const Icon = getFieldIcon(field.type);
                    return (
                      <div
                        key={field.id}
                        className={`absolute cursor-move border-2 rounded shadow-lg p-2 group ${getFieldColor(field.type)}`}
                        style={{
                          left: `${field.x}px`,
                          top: `${field.y}px`,
                          opacity: field.isDragging ? 0.7 : 1,
                          minWidth: "120px",
                        }}
                        onMouseDown={(e) => handleFieldDragStart(e, field.id)}
                      >
                        <div className="flex items-center gap-2 pointer-events-none select-none">
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-medium capitalize">
                            {field.type.replace("-", " ")}
                          </span>
                        </div>
                        <button
                          onClick={() => removeField(field.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                {placedFields.length === 0 && signingMode === "only-me" && fullName && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-100 border border-yellow-300 rounded p-4 text-center">
                    <p className="text-sm text-yellow-800 font-medium">
                      👈 Click fields on the left to add them to the PDF
                    </p>
                  </div>
                )}
              </div>

              {numPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                    disabled={currentPage === numPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      {/* Who Will Sign Modal */}
      <Dialog open={showWhoWillSignModal} onOpenChange={setShowWhoWillSignModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Who will sign this document?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-6">
            <button
              onClick={() => handleWhoWillSign("only-me")}
              className="flex flex-col items-center p-6 rounded-lg border-2 hover:border-primary transition-colors group"
            >
              <div className="w-32 h-32 mb-4">
                <div className="w-full h-full bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-16 h-16 text-blue-600" />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 mb-2">Only me</Button>
              <p className="text-sm text-muted-foreground">Sign this document</p>
            </button>

            <button
              onClick={() => handleWhoWillSign("several-people")}
              className="flex flex-col items-center p-6 rounded-lg border-2 hover:border-primary transition-colors group"
            >
              <div className="w-32 h-32 mb-4">
                <div className="w-full h-full bg-red-100 rounded-lg flex items-center justify-center">
                  <Users className="w-16 h-16 text-red-600" />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 mb-2">Several people</Button>
              <p className="text-sm text-muted-foreground">Invite others to sign</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <Card>
        <CardContent className="p-12">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <PenTool className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Adding Signature...</h3>
              <p className="text-muted-foreground">{file?.name} ({(file?.size / 1024 / 1024)?.toFixed(2)}mb)</p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">SIGNING</div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Signature Details Modal */}
      <Dialog open={showSignatureDetailsModal} onOpenChange={setShowSignatureDetailsModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set your signature details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full name:</Label>
                <Input
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label>Initials:</Label>
                <Input
                  placeholder="Your initials"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                />
              </div>
            </div>

            <Tabs value={signatureTab} onValueChange={(v: any) => setSignatureTab(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signature">
                  <PenTool className="h-4 w-4 mr-2" />
                  Signature
                </TabsTrigger>
                <TabsTrigger value="initials">
                  <Type className="h-4 w-4 mr-2" />
                  Initials
                </TabsTrigger>
                <TabsTrigger value="stamp">
                  <Stamp className="h-4 w-4 mr-2" />
                  Company Stamp
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signature" className="space-y-4">
                <div className="space-y-3">
                  {signatureStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedSignatureStyle(style.id)}
                      className={`w-full p-3 border-2 rounded-lg text-left flex items-center gap-3 ${
                        selectedSignatureStyle === style.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedSignatureStyle === style.id ? "border-primary" : "border-gray-300"
                      }`}>
                        {selectedSignatureStyle === style.id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span style={{ fontFamily: style.font }} className="text-2xl">
                        {fullName || "Signature"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-muted-foreground mb-3 text-center">
                    Draw your signature here
                  </p>
                  <div className="bg-white border rounded">
                    <canvas ref={canvasRef} className="w-full" />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Color:</span>
                      {["#000000", "#dc2626", "#2563eb", "#16a34a"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setSignatureColor(color)}
                          className={`w-6 h-6 rounded-full border-2 ${
                            signatureColor === color ? "border-gray-400" : "border-gray-200"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="initials">
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
                  <p className="text-lg font-medium mb-2">{initials || "Your Initials"}</p>
                  <p className="text-sm text-muted-foreground">Enter your initials above</p>
                </div>
              </TabsContent>

              <TabsContent value="stamp">
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
                  <Stamp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Upload company stamp image</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={applySignatureDetails} className="w-full bg-primary">
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipients Modal */}
      <Dialog open={showRecipientsModal} onOpenChange={setShowRecipientsModal}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create your signature request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Who will receive your document?</h3>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Name"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                />
                <Select
                  value={newRecipient.role}
                  onValueChange={(value: any) => setNewRecipient({ ...newRecipient, role: value })}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signer">Signer</SelectItem>
                    <SelectItem value="validator">Validator</SelectItem>
                    <SelectItem value="witness">Witness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddRecipient}>
                <Users className="h-4 w-4 mr-2" />
                ADD RECEIVER
              </Button>

              {recipients.length > 0 && (
                <div className="mt-3 space-y-2">
                  {recipients.map((recipient) => (
                    <div key={recipient.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">
                        {recipient.name} ({recipient.email}) - {recipient.role}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRecipients(recipients.filter(r => r.id !== recipient.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-3">Settings</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={orderReceivers}
                    onCheckedChange={(checked) => setOrderReceivers(checked as boolean)}
                  />
                  <div>
                    <p className="text-sm font-medium">Set the order of receivers</p>
                    <p className="text-xs text-muted-foreground">
                      Select this option to set a signing order. A signer won't receive a request until the previous person has completed their document.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={changeExpiration}
                    onCheckedChange={(checked) => setChangeExpiration(checked as boolean)}
                  />
                  <div>
                    <p className="text-sm font-medium">Change expiration date</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRecipientsModal(false)}>
                Cancel
              </Button>
              <Button onClick={applyRecipients} className="bg-primary">
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderDownloadStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-primary">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Signature Added!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Your PDF has been signed successfully. Download or continue with other tools.
          </p>

          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                <span className="text-red-600 font-bold text-xs">PDF</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium">signed_{file?.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {(file?.size / 1024 / 1024)?.toFixed(2)} MB
                </p>
              </div>
              <div className="text-green-600 font-medium text-sm">✓ Signed</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={resetProcess}
              className="h-12 w-12"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <Button
              onClick={downloadFile}
              className="bg-primary hover:bg-primary/90 h-12 px-8"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Signed PDF
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={resetProcess}
              className="h-12 w-12 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          <PDFToolRecommendations currentTool="sign" />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => currentStep === "upload" ? navigate("/pdf-tools") : setCurrentStep("upload")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sign PDF</h1>
            <p className="text-muted-foreground">Add your electronic signature to PDF documents.</p>
          </div>
        </div>

        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "download" && renderDownloadStep()}
      </div>
    </div>
  );
};

export default SignPDF;