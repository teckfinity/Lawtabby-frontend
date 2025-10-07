import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, PenTool, Calendar, Trash2, ZoomIn, ZoomOut, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";
import { Document, Page, pdfjs } from 'react-pdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signPDF } from "@/api/api"; // Import the signPDF API function
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ProcessStep = "upload" | "processing" | "download";
type FieldType = "signature" | "date";

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
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const pageRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [showSignatureDetailsModal, setShowSignatureDetailsModal] = useState(false);

  // Signature details
  const [fullName, setFullName] = useState("");

  // Placed fields
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
  const [draggedField, setDraggedField] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [currentPlacingType, setCurrentPlacingType] = useState<FieldType | null>("signature");

  // Signed file URL
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      toast.error("No file selected");
      return;
    }
    const isValid = await isValidPDF(selectedFile);
    if (!isValid) {
      toast.error("Invalid PDF file");
      return;
    }
    setFile(selectedFile);
    setShowSignatureDetailsModal(true); // Open textbox directly
    toast.success("PDF file uploaded successfully");
    event.target.value = "";
  };

  const isValidPDF = async (file: File): Promise<boolean> => {
    try {
      if (file.size === 0 || file.size > 100 * 1024 * 1024) return false;
      const headerBuffer = await file.slice(0, 5).arrayBuffer();
      const header = new Uint8Array(headerBuffer);
      if (
        header[0] !== 0x25 ||
        header[1] !== 0x50 ||
        header[2] !== 0x44 ||
        header[3] !== 0x46 ||
        header[4] !== 0x2d
      ) {
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error validating PDF ${file.name}:`, error);
      return false;
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

  const applySignatureDetails = () => {
    if (!fullName) {
      toast.error("Please enter your full name");
      return;
    }
    setShowSignatureDetailsModal(false);
    toast.success("Signature details saved! Now place fields on the PDF.");
  };

  const addFieldToDocument = (fieldType: FieldType, x: number, y: number, page: number) => {
    let value = '';
    switch (fieldType) {
      case 'signature':
        value = fullName;
        break;
      case 'date':
        value = new Date().toLocaleDateString('en-US');
        break;
    }
    const newField: PlacedField = {
      id: `field-${Date.now()}`,
      type: fieldType,
      x,
      y,
      page,
      value,
    };
    setPlacedFields([...placedFields, newField]);
    toast.success(`${fieldType} field added! Drag to reposition.`);
  };

  const handlePdfClick = (e: React.MouseEvent) => {
    if (currentPlacingType && pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      const renderedX = e.clientX - rect.left;
      const renderedY = e.clientY - rect.top;
      const originalX = renderedX / scale;
      const originalY = renderedY / scale;
      addFieldToDocument(currentPlacingType, originalX, originalY, currentPage);
      setCurrentPlacingType(null);
    }
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
    if (!draggedField || !pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const renderedX = e.clientX - rect.left - draggedField.offsetX;
    const renderedY = e.clientY - rect.top - draggedField.offsetY;
    const originalX = renderedX / scale;
    const originalY = renderedY / scale;

    setPlacedFields(prev =>
      prev.map(field =>
        field.id === draggedField.id
          ? { ...field, x: originalX, y: originalY }
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
      case "date": return Calendar;
    }
  };

  const getFieldColor = (type: FieldType) => {
    switch (type) {
      case "signature": return "bg-green-100 border-green-400 text-green-700";
      case "date": return "bg-blue-100 border-blue-400 text-blue-700";
      default: return "bg-gray-100 border-gray-300 text-gray-700";
    }
  };

  const handleSignPDF = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }

    if (placedFields.length === 0) {
      toast.error("Please place at least one field");
      return;
    }

    setCurrentStep("processing");
    let progressInterval: any;
    try {
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 90) currentProgress = 90;
        setProgress(currentProgress);
      }, 200);

      const signatures = placedFields.map(field => ({
        text: field.value || '',
        page: field.page,
        x: field.x,
        y: field.y,
      }));

      const apiResult = await signPDF(file, signatures);
      const data = apiResult?.data ? apiResult.data : apiResult;
      const signedFilePath = data?.signed_pdf?.signed_file;
      if (!signedFilePath) throw new Error("No signed file path received from server");

      const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const signedUrl = signedFilePath.startsWith("http")
        ? signedFilePath
        : `${apiBase}/pdf/sign_pdf/${signedFilePath}`;

      setSignedFileUrl(signedUrl);

      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => setCurrentStep("download"), 500);
    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
      setProgress(0);
      setCurrentStep("upload");
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to sign PDF. Please ensure all fields are valid.";
      toast.error(`Sign failed: ${errorMessage}`);
      console.error("Sign PDF error:", error);
    }
  };

  const downloadFile = async () => {
    if (!file) {
      toast.error("No PDF to download");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      placedFields.forEach(field => {
        const page = pages[field.page - 1];
        const { x, y, value } = field;
        page.drawText(value || "", {
          x,
          y: page.getHeight() - y - 20,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0.5, 0), // Green color for signature
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `signed_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Signed PDF downloaded successfully!");
    } catch (error: any) {
      console.error("Download failed:", error);
      toast.error(`Failed to download file: ${error?.message || error}`);
    }
  };

  const resetProcess = () => {
    setFile(null);
    setCurrentStep("upload");
    setProgress(0);
    setPlacedFields([]);
    setSignedFileUrl(null);
    setFullName("");
    setCurrentPlacingType("signature");
  };

  const renderUploadStep = () => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
    <div className="lg:col-span-3">
{!file ? (
  <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors h-96 flex items-center justify-center">
    <CardContent className="p-12 text-center flex flex-col items-center justify-center gap-4">
      <Upload className="h-16 w-16 text-muted-foreground" />
      <h3 className="text-xl font-semibold">Upload PDF to Sign</h3>
      <p className="text-muted-foreground">Choose a PDF file from your device</p>
      <input
        id="pdf-upload"
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
      <Button
        className="bg-primary hover:bg-primary/90 mt-2"
        onClick={() => document.getElementById("pdf-upload")?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        Select PDF File
      </Button>
    </CardContent>
  </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setScale(Math.max(scale - 0.2, 0.5))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
                  <Button variant="outline" size="icon" onClick={() => setScale(Math.min(scale + 0.2, 2))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {numPages}
                </div>
              </div>

              <div
                id="pdf-container"
                className={`border rounded-lg bg-gray-100 overflow-auto max-h-[600px] relative ${currentPlacingType ? 'cursor-crosshair' : ''}`}
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
                  <div ref={pageRef} style={{ position: 'relative' }} onClick={handlePdfClick}>
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                    {placedFields
                      .filter(field => field.page === currentPage)
                      .map(field => {
                        const Icon = getFieldIcon(field.type);
                        return (
                          <div
                            key={field.id}
                            className={`absolute cursor-move border-2 rounded shadow-lg p-2 group ${getFieldColor(field.type)}`}
                            style={{
                              left: `${field.x * scale}px`,
                              top: `${field.y * scale}px`,
                              opacity: field.isDragging ? 0.7 : 1,
                              minWidth: "120px",
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleFieldDragStart(e, field.id);
                            }}
                          >
                            <div className="flex items-center gap-2 pointer-events-none select-none">
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-medium capitalize">
                                {field.value || field.type.replace("-", " ")}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(field.id);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </Document>
              </div>

              {numPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages}>
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>

    {file && fullName && (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-sm">Fields</h3>

            <button
              onClick={() => setCurrentPlacingType("signature")}
              className="w-full flex items-center gap-3 p-3 mb-2 bg-green-50 border-2 border-green-400 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                <PenTool className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium">Signature</span>
            </button>

            <button
              onClick={() => setCurrentPlacingType("date")}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 border border-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm">Date</span>
            </button>

            <Button onClick={handleSignPDF} className="w-full mt-4 bg-primary" disabled={placedFields.length === 0}>
              Sign →
            </Button>

            {placedFields.length > 0 && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {placedFields.length} field(s) placed
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )}
  </div>
);

return (
  <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
    <div className="max-w-6xl mx-auto">
      {/* Back Button and Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sign PDF</h1>
          <p className="text-muted-foreground">Upload and place signature & date fields on your PDF.</p>
        </div>
      </div>

      {/* Render steps */}
      {currentStep === "upload" && renderUploadStep()}

      {currentStep === "processing" && (
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="p-12">
              <div className="space-y-6">
                <p className="font-semibold text-xl">Signing your PDF...</p>
                <Progress value={progress} className="w-1/2 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

{currentStep === "download" && signedFileUrl && file && (
  <div className="max-w-2xl mx-auto">
    <Card className="border-2 border-primary">
      <CardContent className="p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">Signing Complete!</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your PDF has been signed successfully. Download or continue with other tools.
        </p>

        <div className="bg-muted rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
              <span className="text-red-600 font-bold text-xs">PDF</span>
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-medium">signed_{file.name}</h4>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          {/* Optional: If you want percentage reduction, calculate it here */}
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
)}

      

      {/* Signature Details Modal remains unchanged */}
      <Dialog open={showSignatureDetailsModal} onOpenChange={setShowSignatureDetailsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Signature Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <Button onClick={applySignatureDetails} className="mt-2">
              Save Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </div>
);

};

export default SignPDF;
