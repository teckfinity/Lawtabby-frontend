import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Upload,
  Type,
  Download,
  ZoomIn,
  ZoomOut,
  Square,
  Circle as CircleIcon,
  Minus,
  Pencil,
  Trash2,
  Bold,
  Italic,
  Underline,
  GripVertical,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { Document, Page, pdfjs } from "react-pdf";
import { Progress } from "@/components/ui/progress";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import Draggable from "react-draggable";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ProcessStep = "upload" | "processing" | "download";

/* ----------  SPAN (partial formatting) ---------- */
interface TextSpan {
  id: string;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}
type TextSpans = TextSpan[];

/* ----------  ANNOTATIONS ---------- */
interface TextAnnotation {
  id: string;
  type: "text";
  spans: TextSpans;
  x: number;
  y: number;
  pageNumber: number;
  backgroundColor: string;
  opacity: number; // 0-1
}
interface ShapeAnnotation {
  id: string;
  type: "shape";
  shapeType: "rectangle" | "circle" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  pageNumber: number;
}
interface DrawAnnotation {
  id: string;
  type: "draw";
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  pageNumber: number;
}
type Annotation = TextAnnotation | ShapeAnnotation | DrawAnnotation;

/* ----------  COMPONENT ---------- */
const EditPDF = () => {
  /* ----------  GLOBAL STATE ---------- */
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);

  /* text toolbar */
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff00"); // transparent
  const [opacity, setOpacity] = useState(100); // 0-100

  /* draw / shape */
  const [drawColor, setDrawColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [shapeColor, setShapeColor] = useState("#000000");
  const [selectedShapeType, setSelectedShapeType] = useState<
    "rectangle" | "circle" | "line"
  >("rectangle");

  /* refs */
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const [pageWidth, setPageWidth] = useState(612);
  const [pageHeight, setPageHeight] = useState(792);

  /* ----------  HELPERS ---------- */
  const hexToRgb = (hex: string) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? {
          r: parseInt(m[1], 16),
          g: parseInt(m[2], 16),
          b: parseInt(m[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  /* ----------  FILE UPLOAD ---------- */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setAnnotations([]);
      toast.success("PDF uploaded");
    } else toast.error("Select a valid PDF");
    e.target.value = "";
  };

  /* ----------  TOOLBAR ---------- */
  const editingTools = [
    { id: "text", name: "Add Text", icon: Type },
    { id: "draw", name: "Draw", icon: Pencil },
    { id: "shapes", name: "Add Shape", icon: Square },
  ];

  /* ----------  TEXT TOOL ---------- */
  const [rawTextInput, setRawTextInput] = useState("");
  const [pendingTextSpans, setPendingTextSpans] = useState<TextSpans>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  const applyCurrentStyle = () => {
    if (!rawTextInput.trim()) return;

    const newSpan: TextSpan = {
      id: `span-${Date.now()}`,
      text: rawTextInput,
      fontSize,
      color: textColor,
      fontFamily,
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
    };

    const sel = annotations.find(
      (a): a is TextAnnotation => a.type === "text" && a.id === selectedAnnotationId
    );
    if (sel) {
      const updated = { ...sel, spans: [...sel.spans, newSpan] };
      setAnnotations((prev) => prev.map((a) => (a.id === sel.id ? updated : a)));
    } else {
      setPendingTextSpans([newSpan]);
    }
    setRawTextInput("");
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (selectedTool !== "text") {
      if (selectedTool === "shapes") {
        const canvas = canvasRefs.current[pageNum];
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        const ann: ShapeAnnotation = {
          id: `shape-${Date.now()}`,
          type: "shape",
          shapeType: selectedShapeType,
          x,
          y,
          width: selectedShapeType === "line" ? 150 : 100,
          height:
            selectedShapeType === "line"
              ? 0
              : selectedShapeType === "circle"
              ? 100
              : 60,
          color: shapeColor,
          pageNumber: pageNum,
        };
        setAnnotations((a) => [...a, ann]);
        toast.success(`${selectedShapeType} added`);
        return;
      }
      return;
    }

    if (!pendingTextSpans.length && !rawTextInput) {
      toast.info("Type something first");
      return;
    }

    const canvas = canvasRefs.current[pageNum];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (pendingTextSpans.length) {
      const ann: TextAnnotation = {
        id: `text-${Date.now()}`,
        type: "text",
        spans: pendingTextSpans,
        x,
        y,
        pageNumber: pageNum,
        backgroundColor: bgColor,
        opacity: opacity / 100,
      };
      setAnnotations((a) => [...a, ann]);
      setPendingTextSpans([]);
      toast.success("Text placed");
      return;
    }

    if (selectedAnnotationId && rawTextInput) {
      const sel = annotations.find(
        (a): a is TextAnnotation => a.type === "text" && a.id === selectedAnnotationId
      );
      if (sel) {
        const newSpan: TextSpan = {
          id: `span-${Date.now()}`,
          text: rawTextInput,
          fontSize,
          color: textColor,
          fontFamily,
          bold: isBold,
          italic: isItalic,
          underline: isUnderline,
        };
        const updated = { ...sel, spans: [...sel.spans, newSpan] };
        setAnnotations((prev) => prev.map((a) => (a.id === sel.id ? updated : a)));
        setRawTextInput("");
        toast.success("Span added");
      }
    }
  };

  /* ----------  DRAWING ---------- */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (selectedTool !== "draw") return;
    setIsDrawing(true);
    const canvas = canvasRefs.current[pageNum];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setDrawPoints([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (!isDrawing) return;
    const canvas = canvasRefs.current[pageNum];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setDrawPoints((p) => [...p, { x, y }]);
  };

  const handleMouseUp = (pageNum: number) => {
    if (!isDrawing || drawPoints.length < 2) {
      setIsDrawing(false);
      setDrawPoints([]);
      return;
    }
    const ann: DrawAnnotation = {
      id: `draw-${Date.now()}`,
      type: "draw",
      points: drawPoints,
      color: drawColor,
      strokeWidth,
      pageNumber: pageNum,
    };
    setAnnotations((a) => [...a, ann]);
    setDrawPoints([]);
    setIsDrawing(false);
    toast.success("Drawing saved");
  };

  /* ----------  DRAG TEXT ---------- */
  const updateTextPosition = (id: string, deltaX: number, deltaY: number) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === id && a.type === "text"
          ? { ...a, x: a.x + deltaX / scale, y: a.y + deltaY / scale }
          : a
      )
    );
  };

  /* ----------  ANNOTATION PANEL ---------- */
  const selectAnnotation = (id: string) => {
    setSelectedAnnotationId(id);
    const ann = annotations.find((a) => a.id === id) as TextAnnotation | undefined;
    if (ann?.type === "text") {
      const s = ann.spans[0];
      if (s) {
        setFontFamily(s.fontFamily);
        setFontSize(s.fontSize);
        setTextColor(s.color);
        setIsBold(s.bold);
        setIsItalic(s.italic);
        setIsUnderline(s.underline);
        setBgColor(ann.backgroundColor);
        setOpacity(Math.round(ann.opacity * 100));
      }
    }
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((a) => a.filter((x) => x.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
    toast.success("Removed");
  };

  /* ----------  PROCESSING / DOWNLOAD ---------- */
  const completeEditing = () => {
    if (!file) return toast.error("Upload a PDF first");
    setCurrentStep("processing");
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setTimeout(() => setCurrentStep("download"), 400);
      }
      setProgress(p);
    }, 150);
  };

  const downloadFile = async () => {
    if (!file) return;
    try {
      const arrayBuf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuf);
      const pages = pdfDoc.getPages();

      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const courier = await pdfDoc.embedFont(StandardFonts.Courier);

      for (const ann of annotations) {
        const page = pages[ann.pageNumber - 1];
        if (!page) continue;
        const { height } = page.getSize();

        if (ann.type === "text") {
          const lineHeight = ann.spans[0].fontSize * 1.2;
          const totalWidth =
            ann.spans.reduce(
              (sum, s) => sum + helvetica.widthOfTextAtSize(s.text, s.fontSize),
              0
            ) + 8;

          /* ---- Background rectangle (pdf-lib) ---- */
          if (ann.backgroundColor !== "#ffffff00") {
            const bg = hexToRgb(ann.backgroundColor);
            page.drawRectangle({
              x: ann.x,
              y: height - ann.y - lineHeight,
              width: totalWidth,
              height: lineHeight + 4,
              color: rgb(bg.r / 255, bg.g / 255, bg.b / 255),
              opacity: ann.opacity,
            });
          }

          /* ---- Text (full opacity) ---- */
          let cursorX = ann.x;
          for (const span of ann.spans) {
            let font = helvetica;
            if (span.fontFamily === "Times New Roman") font = times;
            else if (span.fontFamily === "Courier") font = courier;
            if (span.bold) font = helveticaBold;

            const col = hexToRgb(span.color);
            page.drawText(span.text, {
              x: cursorX,
              y: height - ann.y,
              size: span.fontSize,
              font,
              color: rgb(col.r / 255, col.g / 255, col.b / 255),
            });

            if (span.underline) {
              const w = font.widthOfTextAtSize(span.text, span.fontSize);
              page.drawLine({
                start: { x: cursorX, y: height - ann.y - 2 },
                end: { x: cursorX + w, y: height - ann.y - 2 },
                thickness: 1,
                color: rgb(col.r / 255, col.g / 255, col.b / 255),
              });
            }
            cursorX += font.widthOfTextAtSize(span.text, span.fontSize);
          }
        } else if (ann.type === "shape") {
          const col = hexToRgb(ann.color);
          const rgbCol = rgb(col.r / 255, col.g / 255, col.b / 255);
          if (ann.shapeType === "rectangle") {
            page.drawRectangle({
              x: ann.x,
              y: height - ann.y - ann.height,
              width: ann.width,
              height: ann.height,
              borderColor: rgbCol,
              borderWidth: 2,
            });
          } else if (ann.shapeType === "circle") {
            page.drawEllipse({
              x: ann.x + ann.width / 2,
              y: height - ann.y - ann.height / 2,
              xScale: ann.width / 2,
              yScale: ann.height / 2,
              borderColor: rgbCol,
              borderWidth: 2,
            });
          } else if (ann.shapeType === "line") {
            page.drawLine({
              start: { x: ann.x, y: height - ann.y },
              end: { x: ann.x + ann.width, y: height - ann.y - ann.height },
              thickness: 2,
              color: rgbCol,
            });
          }
        } else if (ann.type === "draw") {
          const col = hexToRgb(ann.color);
          const rgbCol = rgb(col.r / 255, col.g / 255, col.b / 255);
          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i];
            const p2 = ann.points[i + 1];
            page.drawLine({
              start: { x: p1.x, y: height - p1.y },
              end: { x: p2.x, y: height - p2.y },
              thickness: ann.strokeWidth,
              color: rgbCol,
            });
          }
        }
      }

      const pdfBytes = new Uint8Array(await pdfDoc.save());
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `edited_${file.name}`;
      a.click();
      toast.success("Downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save PDF");
    }
  };

  /* ----------  RENDER CANVAS (annotations + drag) ---------- */
  useEffect(() => {
    Object.entries(canvasRefs.current).forEach(([pnStr, canvas]) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pn = Number(pnStr);
      const pageAnns = annotations.filter((a) => a.pageNumber === pn);
      pageAnns.forEach((ann) => {
        if (ann.type === "text") {
          /* ---- 1. Background (with its own opacity) ---- */
          if (ann.backgroundColor !== "#ffffff00") {
            const lineHeight = ann.spans[0].fontSize * 1.2;
            const totalText = ann.spans.map((s) => s.text).join("");
            const bgWidth = ctx.measureText(totalText).width + 8;

            ctx.globalAlpha = ann.opacity;
            ctx.fillStyle = ann.backgroundColor;
            ctx.fillRect(
              ann.x * scale,
              ann.y * scale - lineHeight,
              bgWidth,
              lineHeight + 4
            );
            ctx.globalAlpha = 1;
          }

          /* ---- 2. Text (always 100% opaque) ---- */
          let curX = ann.x * scale;
          ann.spans.forEach((span) => {
            ctx.font = `${span.bold ? "bold" : ""} ${span.italic ? "italic" : ""
              } ${span.fontSize * scale}px ${span.fontFamily}`;
            ctx.fillStyle = span.color;
            ctx.fillText(span.text, curX, ann.y * scale);

            if (span.underline) {
              const w = ctx.measureText(span.text).width;
              ctx.strokeStyle = span.color;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(curX, ann.y * scale + 2);
              ctx.lineTo(curX + w, ann.y * scale + 2);
              ctx.stroke();
            }
            curX += ctx.measureText(span.text).width;
          });
        } else if (ann.type === "shape") {
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = 2;
          if (ann.shapeType === "rectangle") {
            ctx.strokeRect(
              ann.x * scale,
              ann.y * scale,
              ann.width * scale,
              ann.height * scale
            );
          } else if (ann.shapeType === "circle") {
            ctx.beginPath();
            ctx.ellipse(
              (ann.x + ann.width / 2) * scale,
              (ann.y + ann.height / 2) * scale,
              (ann.width / 2) * scale,
              (ann.height / 2) * scale,
              0,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          } else if (ann.shapeType === "line") {
            ctx.beginPath();
            ctx.moveTo(ann.x * scale, ann.y * scale);
            ctx.lineTo(
              (ann.x + ann.width) * scale,
              (ann.y + ann.height) * scale
            );
            ctx.stroke();
          }
        } else if (ann.type === "draw") {
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.strokeWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x * scale, ann.points[0].y * scale);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x * scale, ann.points[i].y * scale);
          }
          ctx.stroke();
        }
      });
    });

    if (isDrawing && drawPoints.length) {
      const canvas = canvasRefs.current[currentPage];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(drawPoints[0].x * scale, drawPoints[0].y * scale);
      for (let i = 1; i < drawPoints.length; i++) {
        ctx.lineTo(drawPoints[i].x * scale, drawPoints[i].y * scale);
      }
      ctx.stroke();
    }
  }, [
    annotations,
    scale,
    isDrawing,
    drawPoints,
    currentPage,
    drawColor,
    strokeWidth,
  ]);

  /* ----------  UI RENDERERS ---------- */
  const renderUploadStep = () => (
    <div className="w-full">
      {!file ? (
        <Card className="shadow-lg rounded-2xl h-96">
          <CardContent className="p-10 h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">Upload PDF to Edit</h3>
              <Button
                onClick={() => document.getElementById("pdf-upload")?.click()}
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
          {/* LEFT – Tools */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-3">
                <h3 className="font-semibold mb-3 text-sm">Tools</h3>
                {editingTools.map((t) => (
                  <Button
                    key={t.id}
                    variant={selectedTool === t.id ? "default" : "ghost"}
                    className="w-full justify-start text-sm h-9"
                    onClick={() => setSelectedTool(t.id)}
                  >
                    <t.icon className="h-4 w-4 mr-2" />
                    {t.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* CENTER – Canvas + Controls */}
          <div className="lg:col-span-7 space-y-4">
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
                      onChange={(e) => setFontSize(+e.target.value)}
                      className="w-[70px] h-9"
                      min={8}
                      max={72}
                    />

                    <Separator orientation="vertical" className="h-6" />

                    <Button
                      variant={isBold ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setIsBold((b) => !b)}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={isItalic ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setIsItalic((b) => !b)}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={isUnderline ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setIsUnderline((b) => !b)}
                    >
                      <Underline className="h-4 w-4" />
                    </Button>

                    <Separator orientation="vertical" className="h-6" />

                    {/* ---- Foreground colour (text) ---- */}
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-9 h-9 rounded border cursor-pointer"
                      title="Text colour"
                    />

                    {/* ---- Background colour ---- */}
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-9 h-9 rounded border cursor-pointer"
                      title="Background colour"
                    />

                    <div className="flex items-center gap-1">
                      <Label className="text-xs w-12">Opacity</Label>
                      <Slider
                        value={[opacity]}
                        onValueChange={([v]) => setOpacity(v)}
                        max={100}
                        step={1}
                        className="w-20"
                      />
                      <span className="text-xs w-8">{opacity}%</span>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    <Textarea
                      placeholder="Type here… then press Add"
                      value={rawTextInput}
                      onChange={(e) => setRawTextInput(e.target.value)}
                      className="flex-1 min-w-[200px] h-9 resize-none"
                      style={{
                        fontFamily,
                        fontSize: `${Math.min(fontSize, 16)}px`,
                        color: textColor,
                        fontWeight: isBold ? "bold" : "normal",
                        fontStyle: isItalic ? "italic" : "normal",
                        textDecoration: isUnderline ? "underline" : "none",
                      }}
                    />
                    <Button size="sm" onClick={applyCurrentStyle}>
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click on the PDF to place text. Drag the grip to move.
                  </p>
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
                    />
                    <Separator orientation="vertical" className="h-6" />
                    {(["rectangle", "circle", "line"] as const).map((t) => (
                      <Button
                        key={t}
                        variant={selectedShapeType === t ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedShapeType(t)}
                      >
                        {t === "rectangle" && <Square className="h-4 w-4 mr-1" />}
                        {t === "circle" && <CircleIcon className="h-4 w-4 mr-1" />}
                        {t === "line" && <Minus className="h-4 w-4 mr-1" />}
                        {t[0].toUpperCase() + t.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click on the PDF to place a shape
                  </p>
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
                    />
                    <Separator orientation="vertical" className="h-6" />
                    <Label className="text-sm">Stroke</Label>
                    <Input
                      type="number"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(+e.target.value)}
                      className="w-[70px] h-9"
                      min={1}
                      max={30}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click and drag to draw
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2 min-w-[50px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setScale((s) => Math.min(s + 0.2, 2))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={completeEditing} size="sm">
                Complete Editing
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="max-h-[720px] overflow-y-auto space-y-6">
                  <Document
                    file={file}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    onLoadError={() => toast.error("PDF load error")}
                  >
                    {Array.from(new Array(numPages), (_, i) => {
                      const pn = i + 1;
                      return (
                        <div
                          key={`page_${pn}`}
                          className="mb-6 border rounded-lg overflow-hidden shadow-sm"
                        >
                          <div className="bg-muted px-3 py-2 text-sm font-medium">
                            Page {pn}
                          </div>
                          <div className="bg-white p-4 flex justify-center relative">
                            <div className="relative inline-block">
                              <Page
                                pageNumber={pn}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-lg"
                                onLoadSuccess={(p) => {
                                  const { width, height } = p;
                                  setPageWidth(width);
                                  setPageHeight(height);
                                  const c = canvasRefs.current[pn];
                                  if (c) {
                                    c.width = width * scale;
                                    c.height = height * scale;
                                  }
                                }}
                              />

                              <canvas
                                ref={(el) => (canvasRefs.current[pn] = el)}
                                className="absolute top-0 left-0 cursor-crosshair"
                                style={{
                                  width: pageWidth * scale,
                                  height: pageHeight * scale,
                                }}
                                onClick={(e) => handleCanvasClick(e, pn)}
                                onMouseDown={(e) => {
                                  setCurrentPage(pn);
                                  handleMouseDown(e, pn);
                                }}
                                onMouseMove={(e) => handleMouseMove(e, pn)}
                                onMouseUp={() => handleMouseUp(pn)}
                                onMouseLeave={() => isDrawing && handleMouseUp(pn)}
                              />

                              {annotations
                                .filter(
                                  (a): a is TextAnnotation =>
                                    a.type === "text" && a.pageNumber === pn
                                )
                                .map((ann) => (
                                  <Draggable
                                    key={ann.id}
                                    defaultPosition={{ x: 0, y: 0 }}
                                    position={{ x: ann.x * scale, y: ann.y * scale }}
                                    onDrag={(_, d) =>
                                      updateTextPosition(ann.id, d.deltaX, d.deltaY)
                                    }
                                    handle=".drag-handle"
                                  >
                                    <div className="absolute flex items-center">
                                      {/* Background layer – respects opacity */}
                                      {ann.backgroundColor !== "#ffffff00" && (
                                        <div
                                          className="absolute inset-0 rounded pointer-events-none"
                                          style={{
                                            backgroundColor: ann.backgroundColor,
                                            opacity: ann.opacity,
                                            padding: "2px 4px",
                                          }}
                                        />
                                      )}

                                      <GripVertical className="drag-handle h-4 w-4 text-gray-500 mr-1 cursor-grab z-10" />

                                      {/* Text layer – always 100% opaque */}
                                      <div className="select-none z-10">
                                        {ann.spans.map((sp) => (
                                          <span
                                            key={sp.id}
                                            style={{
                                              fontFamily: sp.fontFamily,
                                              fontSize: `${sp.fontSize * scale}px`,
                                              color: sp.color,
                                              fontWeight: sp.bold ? "bold" : "normal",
                                              fontStyle: sp.italic ? "italic" : "normal",
                                              textDecoration: sp.underline
                                                ? "underline"
                                                : "none",
                                            }}
                                          >
                                            {sp.text}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </Draggable>
                                ))}
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

          {/* RIGHT – Annotation list */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    Annotations ({annotations.length})
                  </h3>
                  {annotations.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAnnotations([]);
                        toast.success("All cleared");
                      }}
                      className="text-destructive"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {annotations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No annotations yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {annotations.map((a) => (
                      <div
                        key={a.id}
                        className={`flex items-center gap-2 p-2 border rounded hover:bg-accent group ${
                          selectedAnnotationId === a.id ? "bg-accent" : ""
                        }`}
                        onClick={() => selectAnnotation(a.id)}
                      >
                        {a.type === "text" && (
                          <Type className="h-4 w-4 text-muted-foreground" />
                        )}
                        {a.type === "shape" && (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                        {a.type === "draw" && (
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="flex-1 text-sm truncate">
                          {a.type === "text" &&
                            (a as TextAnnotation).spans
                              .map((s) => s.text)
                              .join(" ")}
                          {a.type === "shape" &&
                            `${(a as ShapeAnnotation).shapeType} (p${a.pageNumber})`}
                          {a.type === "draw" && `Draw (p${a.pageNumber})`}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAnnotation(a.id);
                          }}
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
              <h3 className="text-xl font-semibold mb-2">Processing…</h3>
              <p className="text-muted-foreground">{file?.name}</p>
            </div>
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
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
          <h3 className="text-xl font-semibold mb-2">Ready!</h3>
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xs">PDF</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium">edited_{file?.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {annotations.length} edit(s)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button onClick={downloadFile} className="h-12 px-8">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setCurrentStep("upload");
                setAnnotations([]);
              }}
              className="h-12 px-8"
            >
              Edit Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              currentStep === "upload" ? history.back() : setCurrentStep("upload")
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit PDF</h1>
            <p className="text-muted-foreground">
              Add rich text, shapes, drawings…
            </p>
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