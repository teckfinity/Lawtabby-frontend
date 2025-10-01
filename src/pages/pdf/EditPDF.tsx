import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Upload, Type, Download, ZoomIn, ZoomOut, Square, Circle as CircleIcon, Minus, Pencil, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Edit3, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Document, Page, pdfjs } from 'react-pdf';
import { Progress } from "@/components/ui/progress";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ProcessStep = "upload" | "processing" | "download";

interface Annotation {
  id: string;
  type: 'text' | 'draw' | 'shape';
  label: string;
  pageNumber: number;
}

const EditPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [textInput, setTextInput] = useState("");
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  
  const [drawColor, setDrawColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("PDF file uploaded successfully");
    }
    event.target.value = '';
  };

  const editingTools = [
    { id: "text", name: "Add Text", icon: Type },
    { id: "draw", name: "Draw", icon: Pencil },
    { id: "shapes", name: "Add Shape", icon: Square },
    { id: "edit-text", name: "Edit Existing Text", icon: Edit3 },
  ];

  const addText = () => {
    if (!textInput) {
      toast.error("Please enter some text first");
      return;
    }
    
    const newAnnotation: Annotation = {
      id: `text-${Date.now()}`,
      type: 'text',
      label: `New Text ${annotations.filter(a => a.type === 'text').length + 1}`,
      pageNumber: 1,
    };
    setAnnotations([...annotations, newAnnotation]);
    toast.success("Text added to PDF");
  };

  const addShape = (shapeType: string) => {
    const newAnnotation: Annotation = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      label: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
      pageNumber: 1,
    };
    setAnnotations([...annotations, newAnnotation]);
    toast.success(`${shapeType} added to PDF`);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    toast.success("Annotation removed");
  };

  const clearAllAnnotations = () => {
    setAnnotations([]);
    toast.success("All annotations cleared");
  };

  const completeEditing = () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }
    
    setCurrentStep("processing");
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep("download");
        }, 500);
      }
      setProgress(currentProgress);
    }, 180);
  };

  const downloadFile = () => {
    toast.success("Download started!");
    setTimeout(() => {
      toast.success("Edited PDF downloaded successfully!");
    }, 1000);
  };

  const resetProcess = () => {
    setFile(null);
    setCurrentStep("upload");
    setProgress(0);
    setAnnotations([]);
    setSelectedTool("");
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    toast.success(`PDF loaded! ${numPages} pages ready for editing.`);
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

  useEffect(() => {
    if (selectedTool === "edit-text") {
      toast.info("Select text to edit, move, or delete the existing content.", {
        duration: 5000,
      });
    }
  }, [selectedTool]);

  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <Card>
        <CardContent className="p-12">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Edit3 className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Processing your edits...</h3>
              <p className="text-muted-foreground">{file?.name} ({(file?.size / 1024 / 1024)?.toFixed(2)}mb)</p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">PROCESSING</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDownloadStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-primary">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">PDF edited successfully!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Your PDF has been edited and is ready to download.
          </p>

          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xs">PDF</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium">edited_{file?.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {(file?.size / 1024 / 1024)?.toFixed(2)} MB • {annotations.length} edits applied
                </p>
              </div>
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
              Download Edited PDF
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

          <PDFToolRecommendations currentTool="edit" />
        </CardContent>
      </Card>
    </div>
  );

  const renderUploadStep = () => (
    <div className="w-full">
      {!file ? (
        <Card className="h-96">
          <CardContent className="p-8 h-full flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload PDF to Edit</h3>
              <p className="text-muted-foreground mb-4">Choose a PDF file from your device to start editing</p>
              <Button 
                onClick={() => document.getElementById('pdf-upload')?.click()}
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select PDF File
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-3">
                <h3 className="font-semibold mb-3 text-sm">Tools</h3>
                <div className="space-y-1">
                  {editingTools.map((tool) => (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? "default" : "ghost"}
                      className="w-full justify-start text-sm h-9"
                      onClick={() => setSelectedTool(tool.id)}
                    >
                      <tool.icon className="h-4 w-4 mr-2" />
                      {tool.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - PDF Viewer */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {/* Text Toolbar */}
              {selectedTool === "text" && (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="w-[140px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Courier">Courier</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-[70px] h-9"
                        min={8}
                        max={72}
                      />

                      <Separator orientation="vertical" className="h-6" />

                      <Button
                        variant={isBold ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setIsBold(!isBold)}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>

                      <Button
                        variant={isItalic ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setIsItalic(!isItalic)}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>

                      <Button
                        variant={isUnderline ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setIsUnderline(!isUnderline)}
                      >
                        <Underline className="h-4 w-4" />
                      </Button>

                      <Separator orientation="vertical" className="h-6" />

                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-9 h-9 rounded border cursor-pointer"
                        title="Text Color"
                      />

                      <Separator orientation="vertical" className="h-6" />

                      <Button
                        variant={textAlign === 'left' ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setTextAlign('left')}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant={textAlign === 'center' ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setTextAlign('center')}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>

                      <Button
                        variant={textAlign === 'right' ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setTextAlign('right')}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>

                      <Separator orientation="vertical" className="h-6" />

                      <Textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type your text here..."
                        className="flex-1 min-w-[200px] h-9 resize-none"
                      />

                      <Button onClick={addText} className="h-9">
                        Add Text
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shapes Toolbar */}
              {selectedTool === "shapes" && (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={drawColor}
                        onChange={(e) => setDrawColor(e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                        title="Shape Color"
                      />
                      <Separator orientation="vertical" className="h-6" />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addShape('rectangle')}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Rectangle
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addShape('circle')}
                      >
                        <CircleIcon className="h-4 w-4 mr-2" />
                        Circle
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addShape('line')}
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Line
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Draw Toolbar */}
              {selectedTool === "draw" && (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={drawColor}
                        onChange={(e) => setDrawColor(e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                        title="Draw Color"
                      />
                      <Separator orientation="vertical" className="h-6" />
                      <Label className="text-sm">Stroke Width:</Label>
                      <Input
                        type="number"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="w-[80px] h-9"
                        min={1}
                        max={20}
                      />
                      <span className="text-sm text-muted-foreground">pt</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Complete Button Bar */}
              <div className="flex items-center justify-end bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomOut}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomIn}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <Button onClick={completeEditing} size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 px-6">
                    Complete Editing →
                  </Button>
                </div>
              </div>

              {/* PDF Viewer */}
              <Card>
                <CardContent className="p-4">
                  <div className="max-h-[700px] overflow-y-auto space-y-4">
                    <Document
                      file={file}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="flex items-center justify-center p-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                      }
                    >
                      {Array.from(new Array(numPages), (_, index) => (
                        <div key={`page_${index + 1}`} className="mb-4 border rounded-lg overflow-hidden shadow-sm">
                          <div className="bg-muted px-3 py-2 text-sm font-medium">
                            Page {index + 1} of {numPages}
                          </div>
                          <div className="bg-white p-4 flex justify-center relative">
                            <Page
                              pageNumber={index + 1}
                              scale={scale}
                              renderTextLayer={selectedTool === "edit-text"}
                              renderAnnotationLayer={true}
                              className="shadow-lg"
                            />
                          </div>
                        </div>
                      ))}
                    </Document>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Page 1</h3>
                  {annotations.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllAnnotations}
                      className="text-destructive h-7 text-xs"
                    >
                      Remove all
                    </Button>
                  )}
                </div>

                {annotations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No annotations yet. Use tools to add text, shapes, or drawings.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {annotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className="flex items-center gap-2 p-2 border rounded hover:bg-accent group"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Type className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm truncate">{annotation.label}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => removeAnnotation(annotation.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTool === "edit-text" && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="text-blue-900">
                      Select text to edit, move, or delete the existing content.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
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
            <h1 className="text-3xl font-bold text-foreground">Edit PDF</h1>
            <p className="text-muted-foreground">Add text, shapes, or draw on your PDF document.</p>
          </div>
        </div>

        <input
          id="pdf-upload"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileUpload}
        />

        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "download" && renderDownloadStep()}
      </div>
    </div>
  );
};

export default EditPDF;
