import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";
import PDFTextEditor from "@/components/PDFTextEditor";
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
  FileText,
  Move,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildLexorbitProcessedFilename,
  triggerBlobDownload,
} from "@/utils/lexorbitFilename";
import { Document, Page, pdfjs } from "react-pdf";
import { Progress } from "@/components/ui/progress";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import Draggable from "react-draggable";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ProcessStep = "upload" | "processing" | "download";

/* ---------- SPAN (partial formatting) ---------- */
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

/* ---------- ANNOTATIONS ---------- */
interface TextAnnotation {
  id: string;
  type: "text";
  spans: TextSpans;
  x: number;
  y: number;
  width: number;
  height: number;
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

/* ---------- COMPONENT ---------- */
const EditPDF = () => {
  /* ---------- GLOBAL STATE ---------- */
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
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [textSelection, setTextSelection] = useState<{
    annotationId: string;
    start: number;
    end: number;
  } | null>(null);
  const [isEditingText, setIsEditingText] = useState<string | null>(null);
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
  const pdfUploadInputRef = useRef<HTMLInputElement>(null);

  /* ---------- HELPERS ---------- */
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

  /* ---------- FILE UPLOAD ---------- */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || f.type !== "application/pdf") {
      toast.error("Please select a valid PDF file");
      return;
    }
    setFile(f);
    setAnnotations([]);
    try {
      const buf = await f.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      const pages = pdf.getPages();
      const numPages = pages.length;
      setNumPages(numPages);
      toast.success(`PDF loaded – ${numPages} page${numPages > 1 ? "s" : ""}`);
      setCurrentStep("upload");
    } catch (err) {
      console.error(err);
      toast.error("Failed to read PDF");
    }
    e.target.value = "";
  };

  /* ---------- WORD EDITOR STATE ---------- */
  const [isWordMode, setIsWordMode] = useState(false);

  /* ---------- TOOLBAR ---------- */
  const editingTools = [
    { id: "shapes", name: "Shapes", icon: Square },
    { id: "draw", name: "Draw", icon: Pencil },
    { id: "text", name: "Add Text", icon: Type },
    { id: "word", name: "Edit PDF", icon: FileText },
  ];

  /* ---------- TEXT TOOL ---------- */
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

  const updateSelectedSpan = () => {
    if (!selectedSpanId || !selectedAnnotationId) return;
    const sel = annotations.find(
      (a): a is TextAnnotation => a.type === "text" && a.id === selectedAnnotationId
    );
    if (!sel) return;
    const updatedSpans = sel.spans.map((span) =>
      span.id === selectedSpanId
        ? {
            ...span,
            fontSize,
            color: textColor,
            fontFamily,
            bold: isBold,
            italic: isItalic,
            underline: isUnderline,
          }
        : span
    );
    setAnnotations((prev) =>
      prev.map((a) => (a.id === sel.id ? { ...sel, spans: updatedSpans } : a))
    );
    toast.success("Word style updated");
  };


  const applyFormattingToSelection = () => {
    if (!textSelection) return;
    const { annotationId, start, end } = textSelection;
    const ann = annotations.find(
      (a): a is TextAnnotation => a.type === "text" && a.id === annotationId
    );
    if (!ann) return;

    // Calculate the full text and positions
    let currentPos = 0;
    const newSpans: TextSpan[] = [];

    for (const span of ann.spans) {
      const spanStart = currentPos;
      const spanEnd = currentPos + span.text.length;

      if (spanEnd <= start || spanStart >= end) {
        // Span is completely outside selection
        newSpans.push(span);
      } else if (spanStart >= start && spanEnd <= end) {
        // Span is completely inside selection - apply formatting
        newSpans.push({
          ...span,
          fontSize,
          color: textColor,
          fontFamily,
          bold: isBold,
          italic: isItalic,
          underline: isUnderline,
        });
      } else {
        // Span is partially selected - split it
        if (spanStart < start) {
          // Add the part before selection
          newSpans.push({
            ...span,
            id: `span-${Date.now()}-before`,
            text: span.text.substring(0, start - spanStart),
          });
        }

        // Add the selected part with new formatting
        const selStart = Math.max(0, start - spanStart);
        const selEnd = Math.min(span.text.length, end - spanStart);
        newSpans.push({
          id: `span-${Date.now()}-selected`,
          text: span.text.substring(selStart, selEnd),
          fontSize,
          color: textColor,
          fontFamily,
          bold: isBold,
          italic: isItalic,
          underline: isUnderline,
        });

        if (spanEnd > end) {
          // Add the part after selection
          newSpans.push({
            ...span,
            id: `span-${Date.now()}-after`,
            text: span.text.substring(end - spanStart),
          });
        }
      }

      currentPos = spanEnd + 1; // +1 for space between words
    }

    setAnnotations((prev) =>
      prev.map((a) => (a.id === annotationId ? { ...ann, spans: newSpans } : a))
    );
    setTextSelection(null);
    toast.success("Formatting applied to selection");
  };

  const deleteSelectedSpan = () => {
    if (!selectedSpanId || !selectedAnnotationId) return;
    const sel = annotations.find(
      (a): a is TextAnnotation => a.type === "text" && a.id === selectedAnnotationId
    );
    if (!sel) return;
    const updatedSpans = sel.spans.filter((span) => span.id !== selectedSpanId);
    if (updatedSpans.length === 0) {
      setAnnotations((prev) => prev.filter((a) => a.id !== sel.id));
      setSelectedAnnotationId(null);
    } else {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === sel.id ? { ...sel, spans: updatedSpans } : a))
      );
    }
    setSelectedSpanId(null);
    toast.success("Word deleted");
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle') || target.classList.contains('draggable-annotation')) {
      return;
    }
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
        setSelectedTool("");
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
      const avgCharWidth = fontSize * 0.6;
      const totalTextWidth = pendingTextSpans.reduce(
        (sum, s) => sum + s.text.length * avgCharWidth,
        0
      );
      const lineHeight = fontSize * 1.2;
      const padding = 16;
      const ann: TextAnnotation = {
        id: `text-${Date.now()}`,
        type: "text",
        spans: pendingTextSpans,
        x,
        y,
        width: Math.max(80, totalTextWidth + padding),
        height: lineHeight + padding,
        pageNumber: pageNum,
        backgroundColor: bgColor,
        opacity: opacity / 100,
      };
      setAnnotations((a) => [...a, ann]);
      setPendingTextSpans([]);
      toast.success("Text box placed – drag to move, resize with handles");
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

  /* ---------- DRAWING (with smoothing) ---------- */
  const smoothPoints = (points: { x: number; y: number }[]) => {
    if (points.length < 3) return points;
    const smoothed: { x: number; y: number }[] = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      smoothed.push({
        x: (prev.x + curr.x + next.x) / 3,
        y: (prev.y + curr.y + next.y) / 3,
      });
    }
    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

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
    const smoothed = smoothPoints(drawPoints);
    const ann: DrawAnnotation = {
      id: `draw-${Date.now()}`,
      type: "draw",
      points: smoothed,
      color: drawColor,
      strokeWidth,
      pageNumber: pageNum,
    };
    setAnnotations((a) => [...a, ann]);
    setDrawPoints([]);
    setIsDrawing(false);
    toast.success("Drawing saved");
  };

  /* ---------- DRAG & RESIZE ---------- */
  const updateTextPosition = (id: string, deltaX: number, deltaY: number) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === id && a.type === "text"
          ? { ...a, x: a.x + deltaX / scale, y: a.y + deltaY / scale }
          : a
      )
    );
  };
  const updateTextSize = (
    id: string,
    newWidth: number,
    newHeight: number,
    newX?: number,
    newY?: number
  ) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === id && a.type === "text"
          ? {
              ...a,
              width: Math.max(50, newWidth),
              height: Math.max(20, newHeight),
              ...(newX !== undefined && { x: newX }),
              ...(newY !== undefined && { y: newY }),
            }
          : a
      )
    );
  };
  const updateShapePosition = (id: string, deltaX: number, deltaY: number) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === id && a.type === "shape"
          ? { ...a, x: a.x + deltaX / scale, y: a.y + deltaY / scale }
          : a
      )
    );
  };
  const updateShapeSize = (
    id: string,
    newWidth: number,
    newHeight: number,
    newX?: number,
    newY?: number
  ) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === id && a.type === "shape"
          ? {
              ...a,
              width: newWidth,
              height: newHeight,
              ...(newX !== undefined && { x: newX }),
              ...(newY !== undefined && { y: newY }),
            }
          : a
      )
    );
  };

  /* ---------- ANNOTATION PANEL ---------- */
  const selectAnnotation = (id: string) => {
    setSelectedAnnotationId(id);
    setSelectedSpanId(null);
    setTextSelection(null);
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
  const selectSpan = (spanId: string) => {
    setSelectedSpanId(spanId);
    const sel = annotations.find(
      (a): a is TextAnnotation => a.type === "text" && a.id === selectedAnnotationId
    );
    if (!sel) return;
    const span = sel.spans.find((s) => s.id === spanId);
    if (span) {
      setFontFamily(span.fontFamily);
      setFontSize(span.fontSize);
      setTextColor(span.color);
      setIsBold(span.bold);
      setIsItalic(span.italic);
      setIsUnderline(span.underline);
    }
  };
  const removeAnnotation = (id: string) => {
    setAnnotations((a) => a.filter((x) => x.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
    toast.success("Removed");
  };

  /* ---------- CONVERT TO WORD ---------- */
  const handleWordToolClick = () => {
    if (!file) {
      toast.error("Please upload a PDF first");
      return;
    }
    setIsWordMode(true);
  };

  const cancelWordMode = () => {
    setIsWordMode(false);
    setSelectedTool("");
  };

  /* ---------- PROCESSING / DOWNLOAD ---------- */
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
          const bgPadding = 6;
          if (ann.backgroundColor !== "#ffffff00") {
            const bg = hexToRgb(ann.backgroundColor);
            page.drawRectangle({
              x: ann.x - bgPadding / 2,
              y: height - ann.y - ann.height + bgPadding / 2,
              width: ann.width + bgPadding,
              height: ann.height - bgPadding,
              color: rgb(bg.r / 255, bg.g / 255, bg.b / 255),
              opacity: ann.opacity,
            });
          }
          let cursorX = ann.x + 8;
          const textY = height - ann.y - ann.height / 2 - ann.spans[0].fontSize / 2 + ann.spans[0].fontSize * 0.15;
          for (const span of ann.spans) {
            let font = helvetica;
            if (span.fontFamily === "Times New Roman") font = times;
            else if (span.fontFamily === "Courier") font = courier;
            if (span.bold) font = helveticaBold;
            const col = hexToRgb(span.color);
            page.drawText(span.text, {
              x: cursorX,
              y: textY,
              size: span.fontSize,
              font,
              color: rgb(col.r / 255, col.g / 255, col.b / 255),
            });
            if (span.underline) {
              const w = font.widthOfTextAtSize(span.text, span.fontSize);
              const underlineY = textY - 2;
              page.drawLine({
                start: { x: cursorX, y: underlineY },
                end: { x: cursorX + w, y: underlineY },
                thickness: 1,
                color: rgb(col.r / 255, col.g / 255, col.b / 255),
              });
            }
            cursorX += font.widthOfTextAtSize(span.text, span.fontSize) + 2;
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
          if (ann.points.length > 0) {
            for (let i = 0; i < ann.points.length - 1; i++) {
              const curr = ann.points[i];
              const next = ann.points[i + 1];
              const steps = 3;
              for (let step = 0; step < steps; step++) {
                const t1 = step / steps;
                const t2 = (step + 1) / steps;
                const x1 = curr.x + (next.x - curr.x) * t1;
                const y1 = curr.y + (next.y - curr.y) * t1;
                const x2 = curr.x + (next.x - curr.x) * t2;
                const y2 = curr.y + (next.y - curr.y) * t2;
                page.drawLine({
                  start: { x: x1, y: height - y1 },
                  end: { x: x2, y: height - y2 },
                  thickness: ann.strokeWidth,
                  color: rgbCol,
                  opacity: 1,
                });
              }
            }
            for (const point of ann.points) {
              page.drawCircle({
                x: point.x,
                y: height - point.y,
                size: ann.strokeWidth / 2,
                color: rgbCol,
                opacity: 1,
              });
            }
          }
        }
      }
      const pdfBytes = new Uint8Array(await pdfDoc.save());
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      triggerBlobDownload(blob, buildLexorbitProcessedFilename(file.name, "edited"));
      toast.success("Downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save PDF");
    }
  };

  /* ---------- RESET (only what is needed for the download step) ---------- */
  const resetAll = () => {
    setFile(null);
    setCurrentStep("upload");
    setProgress(0);
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setSelectedSpanId(null);
  };

  /* ---------- RENDER CANVAS (annotations only, no drag UI) ---------- */
  useEffect(() => {
    Object.entries(canvasRefs.current).forEach(([pnStr, canvas]) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pn = Number(pnStr);
      const pageAnns = annotations.filter((a) => a.pageNumber === pn);
      pageAnns.forEach((ann) => {
        if (ann.type === "draw") {
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.strokeWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          if (ann.points.length > 0) {
            ctx.moveTo(ann.points[0].x * scale, ann.points[0].y * scale);
            for (let i = 1; i < ann.points.length; i++) {
              const prev = ann.points[i - 1];
              const curr = ann.points[i];
              const cpX = (prev.x + curr.x) / 2;
              const cpY = (prev.y + curr.y) / 2;
              ctx.quadraticCurveTo(
                prev.x * scale,
                prev.y * scale,
                cpX * scale,
                cpY * scale
              );
            }
            ctx.lineTo(
              ann.points[ann.points.length - 1].x * scale,
              ann.points[ann.points.length - 1].y * scale
            );
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
      if (drawPoints.length > 0) {
        ctx.moveTo(drawPoints[0].x * scale, drawPoints[0].y * scale);
        for (let i = 1; i < drawPoints.length; i++) {
          const prev = drawPoints[i - 1];
          const curr = drawPoints[i];
          const cpX = (prev.x + curr.x) / 2;
          const cpY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(
            prev.x * scale,
            prev.y * scale,
            cpX * scale,
            cpY * scale
          );
        }
        ctx.lineTo(
          drawPoints[drawPoints.length - 1].x * scale,
          drawPoints[drawPoints.length - 1].y * scale
        );
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

  /* ---------- UI RENDERERS ---------- */
  const renderUploadStep = () => (
    <div className="w-full">
      <Card className="shadow-lg rounded-2xl">
        <CardContent className="p-8">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <Upload className="h-12 w-8 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF to Edit</h3>
                <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
                <Button onClick={() => pdfUploadInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select PDF File
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                <span className="text-red-600 font-bold text-xs">PDF</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{file.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {numPages} page{numPages > 1 ? "s" : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <input
        ref={pdfUploadInputRef}
        id="pdf-upload"
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
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
          <h3 className="text-xl font-semibold mb-2">PDF edit successfully!</h3>
              <p className="text-muted-foreground mb-8">
      
               Your PDF has been edited
          </p>
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xs">PDF</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium">
                  {file ? buildLexorbitProcessedFilename(file.name, "edited") : "document_lexorbit_edited.pdf"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  ready to download
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="icon" onClick={resetAll}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button onClick={downloadFile} className="px-10">
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="icon" onClick={resetAll}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-10">
            <PDFToolRecommendations currentTool="edit" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto pt-6 pb-10 px-6 lg:px-8">
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

        {currentStep === "upload" && !isWordMode && renderUploadStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "download" && renderDownloadStep()}

        {/* Word Editor Mode - PDF to HTML Editor */}
        {isWordMode && file && (
          <div className="mt-6">
            <Card>
              <CardContent className="p-0 h-[calc(100vh-200px)] min-h-[600px]">
                <PDFTextEditor
                  file={file}
                  onSave={async (newFile) => {
                    setFile(newFile);
                    setIsWordMode(false);
                    setSelectedTool("");
                    try {
                      const buf = await newFile.arrayBuffer();
                      const pdf = await PDFDocument.load(buf);
                      setNumPages(pdf.getPageCount());
                    } catch {
                      /* keep prior page count */
                    }
                    setCurrentStep("download");
                    toast.success("PDF text updated successfully!");
                  }}
                  onCancel={cancelWordMode}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Editing UI (only when file is uploaded and step is upload) */}
        {file && currentStep === "upload" && !isWordMode && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
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
                      onClick={() => {
                        if (t.id === "word") {
                          handleWordToolClick();
                        } else {
                          setSelectedTool(t.id);
                        }
                      }}
                    >
                      <t.icon className="h-4 w-4 mr-2" />
                      {t.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* CENTER – Canvas + Controls */}
            <div className="lg:col-span-8 space-y-4">
              {selectedTool === "text" && (
                <Card>
                  <CardContent className="p-3 space-y-3">
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
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-9 h-9 rounded border cursor-pointer"
                        title="Text colour"
                      />
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
                    {selectedAnnotationId && selectedSpanId && !textSelection && (
                      <div className="flex items-center gap-2 p-2 bg-accent rounded">
                        <span className="text-xs font-medium">Editing word:</span>
                        <Button size="sm" onClick={updateSelectedSpan}>
                          Update Style
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={deleteSelectedSpan}
                        >
                          Delete Word
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSpanId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    {textSelection && (
                      <div className="flex items-center gap-2 p-2 bg-accent rounded">
                        <span className="text-xs font-medium">Text selected ({textSelection.end - textSelection.start} chars):</span>
                        <Button size="sm" onClick={applyFormattingToSelection}>
                          Apply Formatting
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTextSelection(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {selectedSpanId
                        ? "Adjust formatting above, then Update Style"
                        : textSelection
                        ? "Adjust formatting above, then Apply Formatting to selection"
                        : "Click on the PDF to place text. Double-click text to select and format parts. Drag grip to move."}
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
                      Click on the PDF to place a shape. Drag to move, resize with handles.
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
                      Click and drag to draw smooth lines
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
                                  className="absolute top-0 left-0 cursor-crosshair pointer-events-none"
                                  style={{
                                    width: pageWidth * scale,
                                    height: pageHeight * scale,
                                  }}
                                />
                                <div
                                  className="absolute top-0 left-0 cursor-crosshair"
                                  style={{
                                    width: pageWidth * scale,
                                    height: pageHeight * scale,
                                  }}
                                  onClick={(e) => handleCanvasClick(e as any, pn)}
                                  onMouseDown={(e) => {
                                    setCurrentPage(pn);
                                    handleMouseDown(e as any, pn);
                                  }}
                                  onMouseMove={(e) => handleMouseMove(e as any, pn)}
                                  onMouseUp={() => handleMouseUp(pn)}
                                  onMouseLeave={() => isDrawing && handleMouseUp(pn)}
                                >
                                  {/* TEXT ANNOTATIONS WITH RESIZE */}
                                  {annotations
                                    .filter(
                                      (a): a is TextAnnotation =>
                                        a.type === "text" && a.pageNumber === pn
                                    )
                                    .map((ann) => {
                                      const TextResizeHandle = ({ position }: { position: string }) => {
                                        const handleResize = (e: React.MouseEvent<HTMLDivElement>) => {
                                          e.stopPropagation();
                                          const startX = e.clientX;
                                          const startY = e.clientY;
                                          const startWidth = ann.width;
                                          const startHeight = ann.height;
                                          const startXPos = ann.x;
                                          const startYPos = ann.y;
                                          const onMouseMove = (moveEvent: MouseEvent) => {
                                            const deltaX = (moveEvent.clientX - startX) / scale;
                                            const deltaY = (moveEvent.clientY - startY) / scale;
                                            let newWidth = startWidth;
                                            let newHeight = startHeight;
                                            let newX = startXPos;
                                            let newY = startYPos;
                                            if (position.includes("right")) newWidth = startWidth + deltaX;
                                            if (position.includes("left")) { newWidth = startWidth - deltaX; newX = startXPos + deltaX; }
                                            if (position.includes("bottom")) newHeight = startHeight + deltaY;
                                            if (position.includes("top")) { newHeight = startHeight - deltaY; newY = startYPos + deltaY; }
                                            updateTextSize(ann.id, newWidth, newHeight, newX, newY);
                                          };
                                          const onMouseUp = () => {
                                            document.removeEventListener("mousemove", onMouseMove);
                                            document.removeEventListener("mouseup", onMouseUp);
                                          };
                                          document.addEventListener("mousemove", onMouseMove);
                                          document.addEventListener("mouseup", onMouseUp);
                                        };
                                        const classes = {
                                          "top-left": "-top-1 -left-1 cursor-nw-resize",
                                          "top-right": "-top-1 -right-1 cursor-ne-resize",
                                          "bottom-left": "-bottom-1 -left-1 cursor-sw-resize",
                                          "bottom-right": "-bottom-1 -right-1 cursor-se-resize",
                                          top: "-top-1 left-1/2 -translate-x-1/2 cursor-n-resize",
                                          bottom: "-bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize",
                                          left: "top-1/2 -left-1 -translate-y-1/2 cursor-w-resize",
                                          right: "top-1/2 -right-1 -translate-y-1/2 cursor-e-resize",
                                        };
                                        return (
                                          <div
                                            className={`absolute w-2 h-2 bg-primary border border-background rounded-sm opacity-0 group-hover:opacity-100 transition-opacity ${classes[position as keyof typeof classes]}`}
                                            onMouseDown={handleResize}
                                          />
                                        );
                                      };
                                      return (
                                        <Draggable
                                          key={ann.id}
                                          position={{ x: ann.x * scale, y: ann.y * scale }}
                                          onDrag={(_, d) => updateTextPosition(ann.id, d.deltaX, d.deltaY)}
                                        >
                                          <div
                                            className="absolute group"
                                            style={{
                                              width: ann.width * scale,
                                              height: ann.height * scale,
                                            }}
                                          >
                                            {ann.backgroundColor !== "#ffffff00" && (
                                              <div
                                                className="absolute inset-0 rounded pointer-events-none"
                                                style={{
                                                  backgroundColor: ann.backgroundColor,
                                                  opacity: ann.opacity,
                                                }}
                                              />
                                            )}
                                            <div className="absolute inset-0 border-2 border-transparent rounded group-hover:border-primary/30 transition-colors" />
                                            <GripVertical className="drag-handle absolute left-1 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50 hover:text-primary cursor-grab active:cursor-grabbing z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <Button
                                              variant="destructive"
                                              size="icon"
                                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                removeAnnotation(ann.id);
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                            <div
                                              className="relative z-10 p-2 cursor-pointer flex items-center justify-start h-full overflow-hidden"
                                              onClick={() => selectAnnotation(ann.id)}
                                              onDoubleClick={() => {
                                                setIsEditingText(ann.id);
                                                setTextSelection(null);
                                                setSelectedSpanId(null);
                                              }}
                                            >
                                              {ann.spans.map((sp, idx) => (
                                                <span
                                                  key={sp.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectAnnotation(ann.id);
                                                    selectSpan(sp.id);
                                                  }}
                                                  onMouseUp={(e) => {
                                                    if (isEditingText === ann.id) {
                                                      e.stopPropagation();
                                                      const selection = window.getSelection();
                                                      if (selection && selection.toString().length > 0) {
                                                        // Calculate character positions
                                                        let currentPos = 0;
                                                        let selStart = 0;
                                                        let selEnd = 0;
                                                        
                                                        // Find the full text
                                                        const fullText = ann.spans.map(s => s.text).join(" ");
                                                        const selectedText = selection.toString();
                                                        const selectedIndex = fullText.indexOf(selectedText);
                                                        
                                                        if (selectedIndex >= 0) {
                                                          selStart = selectedIndex;
                                                          selEnd = selectedIndex + selectedText.length;
                                                          
                                                          setTextSelection({
                                                            annotationId: ann.id,
                                                            start: selStart,
                                                            end: selEnd,
                                                          });
                                                          setSelectedSpanId(null);
                                                        }
                                                      }
                                                    }
                                                  }}
                                                  className={`hover:bg-accent/30 rounded px-0.5 ${
                                                    selectedSpanId === sp.id ? "bg-accent/50" : ""
                                                  } ${isEditingText === ann.id ? "user-select-text" : ""}`}
                                                  style={{
                                                    fontFamily: sp.fontFamily,
                                                    fontSize: `${sp.fontSize}px`,
                                                    color: sp.color,
                                                    fontWeight: sp.bold ? "bold" : "normal",
                                                    fontStyle: sp.italic ? "italic" : "normal",
                                                    textDecoration: sp.underline ? "underline" : "none",
                                                    userSelect: isEditingText === ann.id ? "text" : "none",
                                                  }}
                                                >
                                                  {sp.text}
                                                  {idx < ann.spans.length - 1 && " "}
                                                </span>
                                              ))}
                                            </div>
                                            <TextResizeHandle position="top-left" />
                                            <TextResizeHandle position="top-right" />
                                            <TextResizeHandle position="bottom-left" />
                                            <TextResizeHandle position="bottom-right" />
                                            <TextResizeHandle position="top" />
                                            <TextResizeHandle position="bottom" />
                                            <TextResizeHandle position="left" />
                                            <TextResizeHandle position="right" />
                                          </div>
                                        </Draggable>
                                      );
                                    })}
                                  {/* SHAPES */}
                                  {annotations
                                    .filter(
                                      (a): a is ShapeAnnotation =>
                                        a.type === "shape" && a.pageNumber === pn
                                    )
                                    .map((ann) => {
                                      const ResizeHandle = ({ position }: { position: string }) => {
                                        const handleResize = (e: React.MouseEvent<HTMLDivElement>) => {
                                          e.stopPropagation();
                                          const startX = e.clientX;
                                          const startY = e.clientY;
                                          const startWidth = ann.width;
                                          const startHeight = ann.height;
                                          const startPosX = ann.x;
                                          const startPosY = ann.y;
                                          const handleMouseMove = (moveEvent: MouseEvent) => {
                                            const deltaX = (moveEvent.clientX - startX) / scale;
                                            const deltaY = (moveEvent.clientY - startY) / scale;
                                            if (position.includes("right")) {
                                              updateShapeSize(
                                                ann.id,
                                                Math.max(20, startWidth + deltaX),
                                                position.includes("bottom")
                                                  ? Math.max(20, startHeight + deltaY)
                                                  : position.includes("top")
                                                  ? Math.max(20, startHeight - deltaY)
                                                  : startHeight,
                                                position.includes("left")
                                                  ? startPosX + deltaX
                                                  : startPosX,
                                                position.includes("top")
                                                  ? startPosY + deltaY
                                                  : startPosY
                                              );
                                            } else if (position.includes("left")) {
                                              const newWidth = Math.max(20, startWidth - deltaX);
                                              updateShapeSize(
                                                ann.id,
                                                newWidth,
                                                position.includes("bottom")
                                                  ? Math.max(20, startHeight + deltaY)
                                                  : position.includes("top")
                                                  ? Math.max(20, startHeight - deltaY)
                                                  : startHeight,
                                                startPosX + deltaX,
                                                position.includes("top")
                                                  ? startPosY + deltaY
                                                  : startPosY
                                              );
                                            } else if (position.includes("top")) {
                                              const newHeight = Math.max(20, startHeight - deltaY);
                                              updateShapeSize(
                                                ann.id,
                                                startWidth,
                                                newHeight,
                                                startPosX,
                                                startPosY + deltaY
                                              );
                                            } else if (position.includes("bottom")) {
                                              updateShapeSize(
                                                ann.id,
                                                startWidth,
                                                Math.max(20, startHeight + deltaY),
                                                startPosX,
                                                startPosY
                                              );
                                            }
                                          };
                                          const handleMouseUp = () => {
                                            document.removeEventListener("mousemove", handleMouseMove);
                                            document.removeEventListener("mouseup", handleMouseUp);
                                          };
                                          document.addEventListener("mousemove", handleMouseMove);
                                          document.addEventListener("mouseup", handleMouseUp);
                                        };
                                        const positionClasses = {
                                          "top-left": "-top-1 -left-1 cursor-nw-resize",
                                          "top-right": "-top-1 -right-1 cursor-ne-resize",
                                          "bottom-left": "-bottom-1 -left-1 cursor-sw-resize",
                                          "bottom-right": "-bottom-1 -right-1 cursor-se-resize",
                                          top: "-top-1 left-1/2 -translate-x-1/2 cursor-n-resize",
                                          bottom: "-bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize",
                                          left: "top-1/2 -translate-y-1/2 -left-1 cursor-w-resize",
                                          right: "top-1/2 -translate-y-1/2 -right-1 cursor-e-resize",
                                        };
                                        return (
                                          <div
                                            className={`absolute w-2 h-2 bg-primary border border-background rounded-sm opacity-0 group-hover:opacity-100 transition-opacity ${
                                              positionClasses[position as keyof typeof positionClasses]
                                            }`}
                                            onMouseDown={handleResize}
                                          />
                                        );
                                      };
                                      return (
                                        <Draggable
                                          key={ann.id}
                                          position={{
                                            x: ann.x * scale,
                                            y: ann.y * scale,
                                          }}
                                          onDrag={(_, d) =>
                                            updateShapePosition(ann.id, d.deltaX, d.deltaY)
                                          }
                                        >
                                          <div
                                            className="absolute group cursor-move"
                                            style={{
                                              width: ann.width * scale,
                                              height: ann.shapeType === "line" ? 2 : ann.height * scale,
                                            }}
                                          >
                                            <div
                                              className="absolute inset-0 border-2 border-dashed border-transparent group-hover:border-primary/30 transition-colors rounded"
                                              style={{
                                                borderRadius: ann.shapeType === "circle" ? "50%" : "4px",
                                              }}
                                            />
                                            <Move className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            <Button
                                              variant="destructive"
                                              size="icon"
                                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                removeAnnotation(ann.id);
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                            {ann.shapeType !== "line" && (
                                              <>
                                                <ResizeHandle position="top-left" />
                                                <ResizeHandle position="top-right" />
                                                <ResizeHandle position="bottom-left" />
                                                <ResizeHandle position="bottom-right" />
                                                <ResizeHandle position="top" />
                                                <ResizeHandle position="bottom" />
                                                <ResizeHandle position="left" />
                                                <ResizeHandle position="right" />
                                              </>
                                            )}
                                            {ann.shapeType === "line" && (
                                              <>
                                                <div
                                                  className="absolute w-3 h-3 bg-primary border-2 border-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
                                                  style={{
                                                    left: -6,
                                                    top: "calc(50% - 6px)",
                                                  }}
                                                  onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    const startX = e.clientX;
                                                    const startY = e.clientY;
                                                    const startWidth = ann.width;
                                                    const startHeight = ann.height;
                                                    const startPosX = ann.x;
                                                    const startPosY = ann.y;
                                                    const handleMouseMove = (moveEvent: MouseEvent) => {
                                                      const deltaX = (moveEvent.clientX - startX) / scale;
                                                      const deltaY = (moveEvent.clientY - startY) / scale;
                                                      updateShapeSize(
                                                        ann.id,
                                                        startWidth - deltaX,
                                                        startHeight - deltaY,
                                                        startPosX + deltaX,
                                                        startPosY + deltaY
                                                      );
                                                    };
                                                    const handleMouseUp = () => {
                                                      document.removeEventListener("mousemove", handleMouseMove);
                                                      document.removeEventListener("mouseup", handleMouseUp);
                                                    };
                                                    document.addEventListener("mousemove", handleMouseMove);
                                                    document.addEventListener("mouseup", handleMouseUp);
                                                  }}
                                                />
                                                <div
                                                  className="absolute w-3 h-3 bg-primary border-2 border-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
                                                  style={{
                                                    right: -6,
                                                    bottom: ann.height < 0 ? "auto" : -6,
                                                    top: ann.height < 0 ? -6 : "auto",
                                                  }}
                                                  onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    const startX = e.clientX;
                                                    const startY = e.clientY;
                                                    const startWidth = ann.width;
                                                    const startHeight = ann.height;
                                                    const handleMouseMove = (moveEvent: MouseEvent) => {
                                                      const deltaX = (moveEvent.clientX - startX) / scale;
                                                      const deltaY = (moveEvent.clientY - startY) / scale;
                                                      updateShapeSize(
                                                        ann.id,
                                                        startWidth + deltaX,
                                                        startHeight + deltaY
                                                      );
                                                    };
                                                    const handleMouseUp = () => {
                                                      document.removeEventListener("mousemove", handleMouseMove);
                                                      document.removeEventListener("mouseup", handleMouseUp);
                                                    };
                                                    document.addEventListener("mousemove", handleMouseMove);
                                                    document.addEventListener("mouseup", handleMouseUp);
                                                  }}
                                                />
                                              </>
                                            )}
                                            {ann.shapeType === "rectangle" && (
                                              <div
                                                className="absolute inset-0 border-2 pointer-events-none"
                                                style={{ borderColor: ann.color }}
                                              />
                                            )}
                                            {ann.shapeType === "circle" && (
                                              <div
                                                className="absolute inset-0 border-2 rounded-full pointer-events-none"
                                                style={{ borderColor: ann.color }}
                                              />
                                            )}
                                            {ann.shapeType === "line" && (
                                              <svg
                                                className="absolute inset-0 pointer-events-none"
                                                style={{
                                                  width: Math.abs(ann.width * scale) + 20,
                                                  height: Math.abs(ann.height * scale) + 20,
                                                }}
                                              >
                                                  <line
                                                    x1={ann.width >= 0 ? 10 : Math.abs(ann.width * scale) + 10}
                                                    y1={ann.height >= 0 ? 10 : Math.abs(ann.height * scale) + 10}
                                                    x2={ann.width >= 0 ? (Math.abs(ann.width * scale) + 10) : 10}
                                                    y2={ann.height >= 0 ? (Math.abs(ann.height * scale) + 10) : 10}
                                                    stroke={ann.color}
                                                    strokeWidth="2"
                                                  />
                                              </svg>
                                            )}
                                          </div>
                                        </Draggable>
                                      );
                                    })}
                                </div>
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
            <div className="lg:col-span-2 space-y-4">
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
                        <div key={a.id} className="space-y-1">
                          <div
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
                          {a.type === "text" &&
                            selectedAnnotationId === a.id &&
                            (a as TextAnnotation).spans.length > 1 && (
                              <div className="ml-6 pl-2 border-l-2 border-muted space-y-1">
                                {(a as TextAnnotation).spans.map((span) => (
                                  <div
                                    key={span.id}
                                    className={`text-xs p-1.5 rounded cursor-pointer hover:bg-accent/50 ${
                                      selectedSpanId === span.id
                                        ? "bg-accent font-medium"
                                        : "text-muted-foreground"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectSpan(span.id);
                                    }}
                                  >
                                    &ldquo;{span.text}&rdquo;
                                  </div>
                                ))}
                              </div>
                            )}
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
    </div>
  );
};

export default EditPDF;