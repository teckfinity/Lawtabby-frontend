import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Upload, Type, Download, ZoomIn, ZoomOut, Square, Circle as CircleIcon, Minus, Pencil, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Edit3, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Document, Page, pdfjs } from 'react-pdf';
import { Progress } from "@/components/ui/progress";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ProcessStep = "upload" | "processing" | "download";

interface TextAnnotation {
  id: string;
  type: 'text';
  text: string;
  x: number;
  y: number;
  pageNumber: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

interface ShapeAnnotation {
  id: string;
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  pageNumber: number;
}

interface DrawAnnotation {
  id: string;
  type: 'draw';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  pageNumber: number;
}

type Annotation = TextAnnotation | ShapeAnnotation | DrawAnnotation;

const EditPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [textInput, setTextInput] = useState("");
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  
  const [drawColor, setDrawColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [shapeColor, setShapeColor] = useState("#000000");
  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'circle' | 'line'>('rectangle');

  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const [pageWidth, setPageWidth] = useState(612);
  const [pageHeight, setPageHeight] = useState(792);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setAnnotations([]);
      toast.success("PDF file uploaded successfully");
    } else {
      toast.error("Please select a valid PDF file");
    }
    event.target.value = '';
  };

  const editingTools = [
    { id: "text", name: "Add Text", icon: Type },
    { id: "draw", name: "Draw", icon: Pencil },
    { id: "shapes", name: "Add Shape", icon: Square },
  ];

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (selectedTool === "text" && textInput) {
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const newAnnotation: TextAnnotation = {
        id: `text-${Date.now()}`,
        type: 'text',
        text: textInput,
        x,
        y,
        pageNumber: pageNum,
        fontSize,
        color: textColor,
        fontFamily,
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
      };
      setAnnotations([...annotations, newAnnotation]);
      setTextInput("");
      toast.success("Text added to page " + pageNum);
    } else if (selectedTool === "shapes") {
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      // Use selected shape type instead of hardcoded rectangle
      const newAnnotation: ShapeAnnotation = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        shapeType: selectedShapeType,
        x,
        y,
        width: selectedShapeType === 'line' ? 150 : 100,
        height: selectedShapeType === 'line' ? 0 : (selectedShapeType === 'circle' ? 100 : 60),
        color: shapeColor,
        pageNumber: pageNum,
      };
      setAnnotations([...annotations, newAnnotation]);
      toast.success(`${selectedShapeType.charAt(0).toUpperCase() + selectedShapeType.slice(1)} added to page ${pageNum}`);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (selectedTool === "draw") {
      setIsDrawing(true);
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      setDrawPoints([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (selectedTool === "draw" && isDrawing) {
      const canvas = canvasRefs.current[pageNum];
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      setDrawPoints([...drawPoints, { x, y }]);
    }
  };

  const handleMouseUp = (pageNum: number) => {
    if (selectedTool === "draw" && isDrawing && drawPoints.length > 1) {
      const newAnnotation: DrawAnnotation = {
        id: `draw-${Date.now()}`,
        type: 'draw',
        points: drawPoints,
        color: drawColor,
        strokeWidth,
        pageNumber: pageNum,
      };
      setAnnotations([...annotations, newAnnotation]);
      setDrawPoints([]);
      setIsDrawing(false);
      toast.success("Drawing added to page " + pageNum);
    }
  };

  const addShape = (shapeType: 'rectangle' | 'circle' | 'line') => {
    if (!file) {
      toast.error("Please upload a PDF first");
      return;
    }
    setSelectedShapeType(shapeType);
    toast.info(`${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} selected - Click on the page to place it`);
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

  const downloadFile = async () => {
    if (!file) {
      toast.error("No PDF to download");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

      for (const annotation of annotations) {
        const page = pages[annotation.pageNumber - 1];
        if (!page) continue;

        const { height } = page.getSize();

        if (annotation.type === 'text') {
          let font = helveticaFont;
          if (annotation.fontFamily === 'Times New Roman') font = timesFont;
          else if (annotation.fontFamily === 'Courier') font = courierFont;
          if (annotation.bold) font = helveticaBoldFont;

          const color = hexToRgb(annotation.color);
          page.drawText(annotation.text, {
            x: annotation.x,
            y: height - annotation.y,
            size: annotation.fontSize,
            font,
            color: rgb(color.r / 255, color.g / 255, color.b / 255),
          });

          if (annotation.underline) {
            const textWidth = font.widthOfTextAtSize(annotation.text, annotation.fontSize);
            page.drawLine({
              start: { x: annotation.x, y: height - annotation.y - 2 },
              end: { x: annotation.x + textWidth, y: height - annotation.y - 2 },
              thickness: 1,
              color: rgb(color.r / 255, color.g / 255, color.b / 255),
            });
          }
        } else if (annotation.type === 'shape') {
          const color = hexToRgb(annotation.color);
          const rgbColor = rgb(color.r / 255, color.g / 255, color.b / 255);

          if (annotation.shapeType === 'rectangle') {
            page.drawRectangle({
              x: annotation.x,
              y: height - annotation.y - annotation.height,
              width: annotation.width,
              height: annotation.height,
              borderColor: rgbColor,
              borderWidth: 2,
            });
          } else if (annotation.shapeType === 'circle') {
            page.drawEllipse({
              x: annotation.x + annotation.width / 2,
              y: height - annotation.y - annotation.height / 2,
              xScale: annotation.width / 2,
              yScale: annotation.height / 2,
              borderColor: rgbColor,
              borderWidth: 2,
            });
          } else if (annotation.shapeType === 'line') {
            page.drawLine({
              start: { x: annotation.x, y: height - annotation.y },
              end: { x: annotation.x + annotation.width, y: height - annotation.y - annotation.height },
              thickness: 2,
              color: rgbColor,
            });
          }
        } else if (annotation.type === 'draw') {
          const color = hexToRgb(annotation.color);
          const rgbColor = rgb(color.r / 255, color.g / 255, color.b / 255);

          for (let i = 0; i < annotation.points.length - 1; i++) {
            const p1 = annotation.points[i];
            const p2 = annotation.points[i + 1];
            page.drawLine({
              start: { x: p1.x, y: height - p1.y },
              end: { x: p2.x, y: height - p2.y },
              thickness: annotation.strokeWidth,
              color: rgbColor,
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `edited_${file.name}`;
      link.click();

      toast.success("Edited PDF downloaded successfully!");
    } catch (error) {
      console.error("Error saving PDF:", error);
      toast.error("Failed to save PDF. Please try again.");
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
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
    toast.success(`PDF loaded! ${numPages} page(s) ready for editing.`);
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
    annotations.forEach(annotation => {
      const canvas = canvasRefs.current[annotation.pageNumber];
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pageAnnotations = annotations.filter(a => a.pageNumber === annotation.pageNumber);
      
      pageAnnotations.forEach(ann => {
        if (ann.type === 'text') {
          ctx.font = `${ann.bold ? 'bold' : ''} ${ann.italic ? 'italic' : ''} ${ann.fontSize * scale}px ${ann.fontFamily}`;
          ctx.fillStyle = ann.color;
          ctx.fillText(ann.text, ann.x * scale, ann.y * scale);
          
          if (ann.underline) {
            const width = ctx.measureText(ann.text).width;
            ctx.strokeStyle = ann.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ann.x * scale, ann.y * scale + 2);
            ctx.lineTo(ann.x * scale + width, ann.y * scale + 2);
            ctx.stroke();
          }
        } else if (ann.type === 'shape') {
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = 2;
          
          if (ann.shapeType === 'rectangle') {
            ctx.strokeRect(ann.x * scale, ann.y * scale, ann.width * scale, ann.height * scale);
          } else if (ann.shapeType === 'circle') {
            ctx.beginPath();
            ctx.ellipse(
              (ann.x + ann.width / 2) * scale,
              (ann.y + ann.height / 2) * scale,
              (ann.width / 2) * scale,
              (ann.height / 2) * scale,
              0, 0, 2 * Math.PI
            );
            ctx.stroke();
          } else if (ann.shapeType === 'line') {
            ctx.beginPath();
            ctx.moveTo(ann.x * scale, ann.y * scale);
            ctx.lineTo((ann.x + ann.width) * scale, (ann.y + ann.height) * scale);
            ctx.stroke();
          }
        } else if (ann.type === 'draw') {
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x * scale, ann.points[0].y * scale);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x * scale, ann.points[i].y * scale);
          }
          ctx.stroke();
        }
      });
    });

    if (isDrawing && drawPoints.length > 0) {
      const canvas = canvasRefs.current[currentPage];
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(drawPoints[0].x * scale, drawPoints[0].y * scale);
          for (let i = 1; i < drawPoints.length; i++) {
            ctx.lineTo(drawPoints[i].x * scale, drawPoints[i].y * scale);
          }
          ctx.stroke();
        }
      }
    }
  }, [annotations, scale, isDrawing, drawPoints, currentPage, drawColor, strokeWidth]);

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
              <p className="text-muted-foreground">{file?.name} ({(file?.size / 1024 / 1024)?.toFixed(2)}MB)</p>
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
                  {(file?.size / 1024 / 1024)?.toFixed(2)} MB • {annotations.length} edit(s) applied
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={downloadFile}
              className="bg-primary hover:bg-primary/90 h-12 px-8"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Edited PDF
            </Button>

            <Button
              variant="outline"
              onClick={resetProcess}
              className="h-12 px-8"
            >
              Edit Another PDF
            </Button>
          </div>
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

          <div className="lg:col-span-7">
            <div className="space-y-4">
              {selectedTool === "text" && (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="w-[140px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Courier">Courier</SelectItem>
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

                      <Textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type text, then click on PDF to place it..."
                        className="flex-1 min-w-[200px] h-9 resize-none"
                        style={{
                          fontFamily: fontFamily,
                          fontSize: `${Math.min(fontSize, 16)}px`,
                          color: textColor,
                          fontWeight: isBold ? 'bold' : 'normal',
                          fontStyle: isItalic ? 'italic' : 'normal',
                          textDecoration: isUnderline ? 'underline' : 'none',
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Click on the PDF to place your text</p>
                  </CardContent>
                </Card>
              )}

              {selectedTool === "shapes" && (
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={shapeColor}
                        onChange={(e) => setShapeColor(e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                        title="Shape Color"
                      />
                      <Separator orientation="vertical" className="h-6" />
                      <Button 
                        variant={selectedShapeType === 'rectangle' ? "default" : "outline"}
                        size="sm"
                        onClick={() => addShape('rectangle')}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Rectangle
                      </Button>
                      <Button 
                        variant={selectedShapeType === 'circle' ? "default" : "outline"}
                        size="sm"
                        onClick={() => addShape('circle')}
                      >
                        <CircleIcon className="h-4 w-4 mr-2" />
                        Circle
                      </Button>
                      <Button 
                        variant={selectedShapeType === 'line' ? "default" : "outline"}
                        size="sm"
                        onClick={() => addShape('line')}
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Line
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Click on the PDF to place a shape</p>
                  </CardContent>
                </Card>
              )}

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
                    <p className="text-xs text-muted-foreground mt-2">Click and drag on the PDF to draw</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
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
                </div>
                <Button onClick={completeEditing} size="sm" className="bg-primary hover:bg-primary/90 h-8 px-6">
                  Complete Editing →
                </Button>
              </div>

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
                      {Array.from(new Array(numPages), (_, index) => {
                        const pageNum = index + 1;
                        return (
                          <div key={`page_${pageNum}`} className="mb-4 border rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-muted px-3 py-2 text-sm font-medium">
                              Page {pageNum} of {numPages}
                            </div>
                            <div className="bg-white p-4 flex justify-center relative">
                              <div className="relative inline-block">
                                <Page
                                  pageNumber={pageNum}
                                  scale={scale}
                                  renderTextLayer={false}
                                  renderAnnotationLayer={false}
                                  className="shadow-lg"
                                  onLoadSuccess={(page) => {
                                    const { width, height } = page;
                                    setPageWidth(width);
                                    setPageHeight(height);
                                    const canvas = canvasRefs.current[pageNum];
                                    if (canvas) {
                                      canvas.width = width * scale;
                                      canvas.height = height * scale;
                                    }
                                  }}
                                />
                                <canvas
                                  ref={(el) => {
                                    canvasRefs.current[pageNum] = el;
                                  }}
                                  className="absolute top-0 left-0 cursor-crosshair"
                                  style={{
                                    width: pageWidth * scale,
                                    height: pageHeight * scale,
                                  }}
                                  onClick={(e) => handleCanvasClick(e, pageNum)}
                                  onMouseDown={(e) => {
                                    setCurrentPage(pageNum);
                                    handleMouseDown(e, pageNum);
                                  }}
                                  onMouseMove={(e) => handleMouseMove(e, pageNum)}
                                  onMouseUp={() => handleMouseUp(pageNum)}
                                  onMouseLeave={() => {
                                    if (isDrawing) handleMouseUp(pageNum);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </Document>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Annotations ({annotations.length})</h3>
                  {annotations.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllAnnotations}
                      className="text-destructive h-7 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {annotations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No annotations yet. Use tools to add text, shapes, or drawings.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {annotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className="flex items-center gap-2 p-2 border rounded hover:bg-accent group"
                      >
                        {annotation.type === 'text' && <Type className="h-4 w-4 text-muted-foreground" />}
                        {annotation.type === 'shape' && <Square className="h-4 w-4 text-muted-foreground" />}
                        {annotation.type === 'draw' && <Pencil className="h-4 w-4 text-muted-foreground" />}
                        <span className="flex-1 text-sm truncate">
                          {annotation.type === 'text' && (annotation as TextAnnotation).text}
                          {annotation.type === 'shape' && `${(annotation as ShapeAnnotation).shapeType} (Page ${annotation.pageNumber})`}
                          {annotation.type === 'draw' && `Drawing (Page ${annotation.pageNumber})`}
                        </span>
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
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => currentStep === "upload" ? window.history.back() : setCurrentStep("upload")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit PDF</h1>
            <p className="text-muted-foreground">Add text, shapes, or draw on your PDF document</p>
          </div>
        </div>

        <input
          id="pdf-upload"
          type="file"
          accept=".pdf,application/pdf"
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