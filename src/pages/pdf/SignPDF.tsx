/* ────────────────────────────────────────────────────────────────────────── */
/*  SignPDF.tsx – frontend-only version with full drag/resize/re-sign       */
/*  UPLOAD UI NOW IDENTICAL TO StampPDF (only visual change)                */
/* ────────────────────────────────────────────────────────────────────────── */
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  Download,
  PenTool,
  Calendar,
  Trash2,
  ZoomIn,
  ZoomOut,
  Trash,
  Edit3,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  buildLexorbitProcessedFilename,
  triggerBrowserDownload,
} from "@/utils/lexorbitFilename";
import { PdfLibraryPickButton } from "@/components/library/LibraryFileSourceButtons";
import { Progress } from "@/components/ui/progress";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";
import { Document, Page } from "react-pdf";
import "@/lib/pdfjsWorker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Rnd } from "react-rnd";

type ProcessStep = "upload" | "processing" | "download";
type FieldType =
  | "signature"
  | "initials"
  | "date"
  | "stamp"
  | "name"
  | "text"
  | "checkmark"
  | "image";

type SignatureType = "text" | "image";

interface SignatureConfig {
  type: SignatureType;
  content: string; // text or base64
  color?: string;
  font?: string;
  width?: number;
  height?: number;
}

interface PlacedField {
  id: string;
  type: FieldType;
  x: number;
  y: number;
  page: number;
  value?: string;
  imageData?: string;
  color?: string;
  font?: string;
  width: number;
  height: number;
  rotation?: number;
  signerId?: string;
}

interface Signer {
  id: string;
  name: string;
  email?: string;
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Signature styles — three curated choices                              */
/* ────────────────────────────────────────────────────────────────────── */
const SIGNATURE_STYLES = [
  { id: "professional", label: "Professional", font: "Libre Baskerville", style: "font-legal" },
  { id: "handwritten", label: "Handwritten", font: "Shadows Into Light", style: "font-shadows-into-light" },
  { id: "elegant", label: "Elegant", font: "Allura", style: "font-allura" },
] as const;

type SignatureBuildRef = React.MutableRefObject<(() => Promise<SignatureConfig | null>) | null>;

function defaultSignatureColor(): string {
  return document.documentElement.classList.contains("dark") ? "#ffffff" : "#111827";
}

function deriveInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);
}

async function renderTextToSignatureImage(
  text: string,
  fontFamily: string,
  color: string,
  fontSize = 48,
): Promise<SignatureConfig> {
  try {
    await document.fonts.load(`${fontSize}px "${fontFamily}"`);
  } catch {
    /* fallback */
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create signature preview");
  }

  canvas.width = Math.max(text.length * fontSize * 0.62 + 40, 160);
  canvas.height = fontSize + 40;

  ctx.font = `${fontSize}px "${fontFamily}", cursive`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 20, canvas.height / 2);

  return {
    type: "image",
    content: canvas.toDataURL("image/png"),
    width: canvas.width / 2,
    height: canvas.height / 2,
  };
}

/** Flex shell: header + scroll body + sticky footer (avoids clipping action buttons). */
const SIGNATURE_DIALOG_SHELL_CLASS =
  "flex flex-col w-[calc(100vw-1.5rem)] max-w-2xl max-h-[min(92dvh,880px)] overflow-hidden p-0 gap-0 sm:rounded-lg";
const SIGNATURE_DIALOG_HEADER_CLASS = "shrink-0 px-5 pt-5 pb-2 pr-12";
const SIGNATURE_DIALOG_BODY_CLASS =
  "flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-3";
const SIGNATURE_DIALOG_FOOTER_CLASS =
  "shrink-0 border-t bg-background px-5 py-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2";

/** Prevent Enter in inputs from activating dialog footer buttons. */
function preventDialogEnterSubmit(e: React.KeyboardEvent) {
  if (e.key !== "Enter") return;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    e.preventDefault();
  }
}

/* ────────────────────────────────────────────────────────────────────── */
/*  SignatureCreator – streamlined draw / type / upload                   */
/* ────────────────────────────────────────────────────────────────────── */
const SignatureCreator = ({
  onSave,
  initialName,
  onCancel,
  saveButtonLabel = "Save Signature",
  embedded = false,
  saveRef,
  showPreview = true,
}: {
  onSave: (cfg: SignatureConfig) => void;
  initialName: string;
  onCancel?: () => void;
  saveButtonLabel?: string;
  embedded?: boolean;
  saveRef?: SignatureBuildRef;
  showPreview?: boolean;
}) => {
  const [method, setMethod] = useState<"draw" | "type" | "upload">("draw");
  const [text, setText] = useState(initialName);
  const textTouchedRef = useRef(false);
  const [styleId, setStyleId] = useState<(typeof SIGNATURE_STYLES)[number]["id"]>("elegant");
  const [color, setColor] = useState(defaultSignatureColor);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<SignatureConfig | null>(null);
  const [typedPreview, setTypedPreview] = useState<SignatureConfig | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [penColor, setPenColor] = useState(defaultSignatureColor);
  const [lineW, setLineW] = useState(2);
  const [drawVersion, setDrawVersion] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const DRAW_W = 480;
  const DRAW_H = 160;

  const activeStyle =
    SIGNATURE_STYLES.find((s) => s.id === styleId) ?? SIGNATURE_STYLES[2];

  useEffect(() => {
    if (!textTouchedRef.current && initialName.trim()) {
      setText(initialName);
    }
  }, [initialName]);

  useEffect(() => {
    if (method === "draw") {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = penColor;
        ctx.lineWidth = lineW;
        ctx.lineCap = "round";
      }
    }
  }, [method, penColor, lineW]);

  useEffect(() => {
    if (method !== "type") {
      setTypedPreview(null);
      return;
    }
    const sample = text.trim() || initialName.trim();
    if (!sample) {
      setTypedPreview(null);
      return;
    }
    let cancelled = false;
    void renderTextToSignatureImage(sample, activeStyle.font, color).then((cfg) => {
      if (!cancelled) setTypedPreview(cfg);
    });
    return () => {
      cancelled = true;
    };
  }, [method, text, initialName, activeStyle.font, color]);

  const buildCurrentSignature = useCallback(async (): Promise<SignatureConfig | null> => {
    if (method === "type") {
      const sample = text.trim() || initialName.trim();
      if (!sample) return null;
      return renderTextToSignatureImage(sample, activeStyle.font, color);
    }
    if (method === "draw") {
      const data = canvasRef.current?.toDataURL("image/png") ?? "";
      if (!data || data === "data:,") return null;
      return { type: "image", content: data, width: 200, height: 60 };
    }
    return uploadPreview;
  }, [method, text, initialName, activeStyle.font, color, uploadPreview]);

  useEffect(() => {
    if (!embedded || !saveRef) return;
    saveRef.current = buildCurrentSignature;
    return () => {
      saveRef.current = null;
    };
  }, [embedded, saveRef, buildCurrentSignature]);

  const applySignature = async () => {
    const cfg = await buildCurrentSignature();
    if (!cfg) {
      if (method === "draw") toast.error("Please draw your signature first");
      else if (method === "upload") toast.error("Please upload a signature image");
      else toast.error("Please enter your signature text");
      return;
    }
    onSave(cfg);
  };

  const canvasPointFromEvent = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let cx: number;
    let cy: number;
    if ("touches" in e && e.touches.length > 0) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    } else if ("changedTouches" in e && e.changedTouches.length > 0) {
      cx = e.changedTouches[0].clientX;
      cy = e.changedTouches[0].clientY;
    } else {
      const me = e as React.MouseEvent<HTMLCanvasElement>;
      cx = me.clientX;
      cy = me.clientY;
    }
    return {
      x: ((cx - rect.left) / rect.width) * DRAW_W,
      y: ((cy - rect.top) / rect.height) * DRAW_H,
    };
  };

  const startDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    const { x, y } = canvasPointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = canvasPointFromEvent(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (drawing) setDrawVersion((v) => v + 1);
    setDrawing(false);
  };

  const clearDraw = () => {
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, DRAW_W, DRAW_H);
    setDrawVersion((v) => v + 1);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const data = r.result as string;
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        const w = 200;
        const cfg: SignatureConfig = {
          type: "image",
          content: data,
          width: w,
          height: w / ratio,
        };
        setUploadPreview(cfg);
        if (!embedded) onSave(cfg);
      };
      img.src = data;
    };
    r.readAsDataURL(f);
    e.target.value = "";
  };

  const drawPreview =
    method === "draw" ? canvasRef.current?.toDataURL("image/png") : null;
  const previewImage =
    method === "type"
      ? typedPreview?.content
      : method === "draw"
        ? drawPreview && drawPreview !== "data:," ? drawPreview : null
        : uploadPreview?.content;

  const previewLabel =
    method === "type"
      ? text.trim() || initialName.trim() || "Your signature"
      : method === "upload"
        ? "Uploaded signature"
        : "Drawn signature";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">How would you like to sign?</p>
        <div className="flex rounded-lg border bg-muted/40 p-1 gap-1">
          {(["draw", "type", "upload"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={cn(
                "flex-1 rounded-md py-2 text-sm font-medium capitalize transition-colors",
                method === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setMethod(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {method === "draw" && (
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            width={DRAW_W}
            height={DRAW_H}
            className="border border-dashed border-border w-full bg-white rounded-lg cursor-crosshair touch-none h-40 block"
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={stopDraw}
            onTouchCancel={stopDraw}
            style={{ touchAction: "none" }}
          />
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={clearDraw}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {method === "type" && (
        <div className="space-y-3">
          <div>
            <Label>Signature text</Label>
            <Input
              value={text}
              onChange={(e) => {
                textTouchedRef.current = true;
                setText(e.target.value);
              }}
              placeholder={initialName || "Enter your name"}
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SIGNATURE_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setStyleId(style.id)}
                className={cn(
                  "rounded-lg border p-2 text-center transition-all",
                  styleId === style.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div
                  className={cn("text-lg truncate", style.style)}
                  style={{ color, fontFamily: `"${style.font}", cursive` }}
                >
                  {text.trim() || initialName.trim() || "Aa"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{style.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {method === "upload" && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose image
          </Button>
          <p className="text-xs text-muted-foreground text-center">PNG or JPG</p>
        </div>
      )}

      {showPreview && (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
          <Label className="text-xs text-muted-foreground">Preview</Label>
          <div className="flex items-center justify-center min-h-[72px] border-t border-border/60 pt-3">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Signature preview"
                className="max-h-16 max-w-full object-contain"
                key={`${method}-${drawVersion}-${typedPreview?.content?.slice(0, 24)}`}
              />
            ) : (
              <span
                className={cn("text-2xl", method === "type" ? activeStyle.style : "")}
                style={{
                  color,
                  fontFamily:
                    method === "type" ? `"${activeStyle.font}", cursive` : undefined,
                }}
              >
                {method === "type" ? previewLabel : "—"}
              </span>
            )}
          </div>
        </div>
      )}

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")}
            />
            Advanced options
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          <div className="flex gap-2 items-center">
            <Label className="shrink-0 text-xs">Color</Label>
            <input
              type="color"
              value={method === "draw" ? penColor : color}
              onChange={(e) => {
                if (method === "draw") setPenColor(e.target.value);
                else setColor(e.target.value);
              }}
              className="w-10 h-10 rounded-md border cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">
              {method === "draw" ? penColor : color}
            </span>
          </div>
          {method === "draw" && (
            <div>
              <Label className="text-xs">Pen width</Label>
              <input
                type="range"
                min={1}
                max={8}
                value={lineW}
                onChange={(e) => setLineW(+e.target.value)}
                className="w-full mt-1"
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {!embedded && (
        <Button type="button" onClick={() => void applySignature()} className="w-full">
          {saveButtonLabel}
        </Button>
      )}

      {onCancel && !embedded && (
        <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────── */
/*  ReSignModal – edit signature/initials for a specific field            */
/* ────────────────────────────────────────────────────────────────────── */
const ReSignModal = ({
  isOpen,
  onClose,
  fieldType,
  currentValue,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  fieldType: "signature" | "initials";
  currentValue?: string;
  onSave: (cfg: SignatureConfig) => void;
}) => {
  const saveRef = useRef<(() => Promise<SignatureConfig | null>) | null>(null);

  const apply = async () => {
    const cfg = await saveRef.current?.();
    if (!cfg) {
      toast.error("Create your signature first");
      return;
    }
    onSave(cfg);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          saveRef.current = null;
          onClose();
        }
      }}
    >
      <DialogContent className={SIGNATURE_DIALOG_SHELL_CLASS}>
        <DialogHeader className={SIGNATURE_DIALOG_HEADER_CLASS}>
          <DialogTitle>Update {fieldType}</DialogTitle>
        </DialogHeader>
        <div className={SIGNATURE_DIALOG_BODY_CLASS} onKeyDown={preventDialogEnterSubmit}>
          <SignatureCreator
            embedded
            saveRef={saveRef}
            onSave={onSave}
            saveButtonLabel="Save Signature"
            initialName={currentValue || ""}
          />
        </div>
        <div className={SIGNATURE_DIALOG_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void apply()}>
            Apply Signature
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/** Keep placed fields inside PDF logical page bounds (preview uses top‑down coords). */
function clampPlacedFieldToPage(
  field: PlacedField,
  dims: { width: number; height: number } | undefined,
  minWidth = 40,
  minHeight = 28,
): PlacedField {
  if (!dims || dims.width <= 1 || dims.height <= 1) {
    return field;
  }
  const width = Math.max(minWidth, Math.min(field.width, dims.width));
  const height = Math.max(minHeight, Math.min(field.height, dims.height));
  const x = Math.min(Math.max(field.x, 0), Math.max(0, dims.width - width));
  const y = Math.min(Math.max(field.y, 0), Math.max(0, dims.height - height));
  return { ...field, x, y, width, height };
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Sidebar field palette button                                         */
/* ────────────────────────────────────────────────────────────────────── */
const FieldButton = ({
  label,
  hint,
  icon,
  iconBg,
  active,
  activeClass,
  hoverClass,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  iconBg: string;
  active: boolean;
  activeClass: string;
  hoverClass: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
      active ? activeClass : `border-border ${hoverClass}`,
    )}
  >
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
      {icon}
    </div>
    <div className="flex-1 text-left">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  </button>
);

/* ────────────────────────────────────────────────────────────────────── */
/*  Main component                                                       */
/* ────────────────────────────────────────────────────────────────────── */
const SignPDF = () => {
  const navigate = useNavigate();

  /* ---------- Core state ---------- */
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [step, setStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(640);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const pdfUploadInputRef = useRef<HTMLInputElement>(null); // NEW REF
  const imageFieldInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<{
    data: string;
    width: number;
    height: number;
  } | null>(null);

  const [mode, setMode] = useState<"single" | "multiple" | null>(null);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [currentSignerId, setCurrentSignerId] = useState<string | null>(null);

  /* ---------- Signature configs ---------- */
  const [fullSig, setFullSig] = useState<SignatureConfig | null>(null);
  const [initSig, setInitSig] = useState<SignatureConfig | null>(null);

  /* ---------- Modals ---------- */
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [showReSignModal, setShowReSignModal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const signatureSaveRef = useRef<(() => Promise<SignatureConfig | null>) | null>(null);
  const sharedSignatureSaveRef = useRef<(() => Promise<SignatureConfig | null>) | null>(null);

  const pdfDocumentFile = useMemo(() => {
    if (!pdfBytes) return null;
    return { data: pdfBytes.slice() };
  }, [pdfBytes]);

  /* ---------- Fields ---------- */
  const [fields, setFields] = useState<PlacedField[]>([]);
  const [placing, setPlacing] = useState<FieldType | null>(null);

  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const [pdfPagePts, setPdfPagePts] = useState<Array<{ width: number; height: number }>>([]);

  const pagePts = pdfPagePts[page - 1];
  const renderScale =
    pagePts && pagePts.width > 0 ? (containerWidth * scale) / pagePts.width : scale;

  useEffect(() => {
    if (!pdfContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.max(280, entries[0].contentRect.width - 24);
      setContainerWidth(w);
    });
    ro.observe(pdfContainerRef.current);
    return () => ro.disconnect();
  }, [file, mode]);

  /* ──────────────────────────────────────── */
  /*  PDF upload & validation                 */
  /* ──────────────────────────────────────── */
  const loadPdfFromFile = async (f: File) => {
    if (!f) return;
    const ok = await isValidPDF(f);
    if (!ok) {
      toast.error("Invalid PDF file");
      return;
    }
    const buf = await f.arrayBuffer();
    setPdfBytes(new Uint8Array(buf));
    setPdfPagePts([]);
    setFile(f);
    setMode(null);
    setSigners([]);
    setFields([]);
    setFullSig(null);
    setInitSig(null);
    setPendingImage(null);
    setPage(1);
    toast.success("PDF uploaded successfully");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await loadPdfFromFile(f);
    e.target.value = "";
  };

  const isValidPDF = async (f: File) => {
    if (f.size === 0 || f.size > 100 * 1024 * 1024) return false;
    const head = await f.slice(0, 5).arrayBuffer();
    const view = new Uint8Array(head);
    return view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46 && view[4] === 0x2d;
  };

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const onPdfLoadError = useCallback((error: Error) => {
    console.error("Sign PDF preview failed:", error);
    toast.error("Failed to load PDF preview. Try re-uploading the file.");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDims() {
      if (!pdfBytes) {
        setPdfPagePts([]);
        return;
      }
      try {
        const doc = await PDFDocument.load(pdfBytes);
        const pts: Array<{ width: number; height: number }> = [];
        for (let i = 0; i < doc.getPageCount(); i++) {
          const pg = doc.getPage(i);
          pts.push(pg.getSize());
        }
        if (!cancelled) {
          setPdfPagePts(pts);
        }
      } catch {
        if (!cancelled) {
          setPdfPagePts([]);
        }
      }
    }
    void loadDims();
    return () => {
      cancelled = true;
    };
  }, [pdfBytes]);

  /* ──────────────────────────────────────── */
  /*  Single signer – apply signature + continue */
  /* ──────────────────────────────────────── */
  const handleApplySignature = async () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    const build = signatureSaveRef.current;
    if (!build) {
      toast.error("Create your signature first");
      return;
    }
    const cfg = await build();
    if (!cfg) {
      toast.error("Create your signature first");
      return;
    }

    setFullSig(cfg);

    const initText = deriveInitials(fullName);
    if (initText) {
      try {
        const initCfg = await renderTextToSignatureImage(
          initText,
          SIGNATURE_STYLES[2].font,
          defaultSignatureColor(),
          36,
        );
        setInitSig(initCfg);
      } catch {
        setInitSig(null);
      }
    }

    setSigners([{ id: "single-1", name: fullName.trim() }]);
    setShowSingleModal(false);
    signatureSaveRef.current = null;
    toast.success("Ready – place signature fields on the PDF");
  };

  /* ──────────────────────────────────────── */
  /*  Multiple signers                         */
  /* ──────────────────────────────────────── */
  const addSigner = () => setSigners((s) => [...s, { id: Date.now().toString(), name: "", email: "" }]);
  const removeSigner = (id: string) => setSigners((s) => s.filter((x) => x.id !== id));
  const updateSigner = (id: string, field: keyof Signer, v: string) =>
    setSigners((s) => s.map((x) => (x.id === id ? { ...x, [field]: v } : x)));

  const finishMulti = () => {
    const bad = signers.some((s) => !s.name.trim());
    if (bad || signers.length < 2) {
      toast.error("Every signer needs a name (min 2)");
      return;
    }
    setShowMultiModal(false);
    toast.success("Signers saved – now place signature fields");
  };

  /* ──────────────────────────────────────── */
  /*  Handle re-signing for a placed field    */
  /* ──────────────────────────────────────── */
  const handleReSign = (fieldId: string) => {
    setEditingFieldId(fieldId);
    setShowReSignModal(true);
  };

  const saveReSign = (cfg: SignatureConfig) => {
    if (!editingFieldId) return;
    
    const field = fields.find(f => f.id === editingFieldId);
    if (!field) return;

    let signerName = "";
    if (mode === "multiple") {
      const signer = signers.find(s => s.id === field.signerId);
      signerName = signer?.name || "";
    } else {
      signerName = fullName;
    }

    if (cfg.type === "text") {
      setFields(prev => prev.map(f => 
        f.id === editingFieldId 
          ? { 
              ...f, 
              value: cfg.content, 
              color: cfg.color, 
              font: cfg.font, 
              width: cfg.width || f.width, 
              height: cfg.height || f.height,
              imageData: undefined
            }
          : f
      ));
    } else {
      setFields(prev => prev.map(f => 
        f.id === editingFieldId 
          ? { 
              ...f, 
              value: signerName, 
              imageData: cfg.content, 
              width: cfg.width || f.width, 
              height: cfg.height || f.height,
              color: undefined,
              font: undefined
            }
          : f
      ));
    }
    
    toast.success(`${field.type} updated successfully`);
  };

  /* ──────────────────────────────────────── */
  /*  Field placement (click → add)           */
  /* ──────────────────────────────────────── */
  const placeField = (type: FieldType, x: number, y: number, page: number) => {
    let cfg: SignatureConfig | null = null;
    let signerId: string | undefined;
    let value = "";
    let imageData: string | undefined;
    let color: string | undefined;
    let font: string | undefined;
    let w = 150;
    let h = 40;

    const pagePts = pdfPagePts[page - 1];

    // Handle date specially
    if (type === "date") {
      value = new Date().toLocaleDateString();
      setFields((prev) => [
        ...prev,
        clampPlacedFieldToPage(
          {
            id: `f-${Date.now()}`,
            type,
            x,
            y,
            page,
            value,
            color: "#000000",
            font: "Helvetica",
            width: w,
            height: h,
            rotation: 0,
          },
          pagePts,
        ),
      ]);
      toast.success("Date placed – drag to move, resize with corners");
      return;
    }

    // Handle name field - uses signer's name
    if (type === "name") {
      if (mode === "multiple") {
        if (!currentSignerId) {
          toast.error("Select a signer first");
          return;
        }
        const s = signers.find((s) => s.id === currentSignerId);
        if (!s?.name) {
          toast.error("Signer name missing");
          return;
        }
        value = s.name;
        signerId = currentSignerId;
      } else {
        // single mode
        value = fullName;
        signerId = signers[0]?.id;
      }
      
      setFields((prev) => [
        ...prev,
        clampPlacedFieldToPage(
          {
            id: `f-${Date.now()}`,
            type,
            x,
            y,
            page,
            value,
            color: "#000000",
            font: "Helvetica",
            width: w,
            height: h,
            rotation: 0,
            signerId,
          },
          pagePts,
        ),
      ]);
      toast.success("Name placed – drag to move, resize with corners");
      return;
    }

    // Checkmark — small fixed-size tick for forms
    if (type === "checkmark") {
      setFields((prev) => [
        ...prev,
        clampPlacedFieldToPage(
          {
            id: `f-${Date.now()}`,
            type,
            x,
            y,
            page,
            value: "✓",
            color: "#000000",
            width: 28,
            height: 28,
            rotation: 0,
          },
          pagePts,
          24,
          24,
        ),
      ]);
      toast.success("Checkmark placed – drag to move");
      return;
    }

    // Image — uses the uploaded pending image
    if (type === "image") {
      if (!pendingImage) {
        toast.error("Upload an image first");
        return;
      }
      setFields((prev) => [
        ...prev,
        clampPlacedFieldToPage(
          {
            id: `f-${Date.now()}`,
            type,
            x,
            y,
            page,
            imageData: pendingImage.data,
            width: pendingImage.width,
            height: pendingImage.height,
            rotation: 0,
          },
          pagePts,
        ),
      ]);
      toast.success("Image placed – drag to move, resize with corners");
      return;
    }

    // Handle text field - empty editable text
    if (type === "text") {
      setFields((prev) => [
        ...prev,
        clampPlacedFieldToPage(
          {
            id: `f-${Date.now()}`,
            type,
            x,
            y,
            page,
            value: "",
            color: "#000000",
            font: "Helvetica",
            width: w,
            height: h,
            rotation: 0,
          },
          pagePts,
        ),
      ]);
      toast.success("Text placed – double-click to edit, drag to move");
      return;
    }

    // Multiple mode logic for signature/initials
    if (mode === "multiple") {
      if (!currentSignerId) {
        toast.error("Select a signer first");
        return;
      }
      const s = signers.find((s) => s.id === currentSignerId);
      if (!s?.name) {
        toast.error("Signer name missing");
        return;
      }
      value = s.name;
      signerId = currentSignerId;
      if (type === "signature" && fullSig?.type === "image") {
        imageData = fullSig.content;
        w = fullSig.width ?? 200;
        h = fullSig.height ?? 60;
      } else if (type === "initials" && initSig?.type === "image") {
        imageData = initSig.content;
        w = initSig.width ?? 120;
        h = initSig.height ?? 40;
      }
    } else {
      // single mode
      if (type === "signature") cfg = fullSig;
      else if (type === "initials") cfg = initSig;

      if (!cfg) {
        toast.error(`Create a ${type} first`);
        return;
      }
      signerId = signers[0]?.id;

      if (cfg?.type === "text") {
        value = cfg.content;
        color = cfg.color;
        font = cfg.font;
        w = cfg.width ?? 150;
        h = cfg.height ?? 40;
      } else if (cfg?.type === "image") {
        imageData = cfg.content;
        value = fullName;
        w = cfg.width ?? 200;
        h = cfg.height ?? 60;
      }
    }

    const f: PlacedField = clampPlacedFieldToPage(
      {
        id: `f-${Date.now()}`,
        type,
        x,
        y,
        page,
        value,
        imageData,
        color,
        font,
        width: w,
        height: h,
        rotation: 0,
        signerId,
      },
      pagePts,
    );
    setFields((prev) => [...prev, f]);
    toast.success(`${type} placed – drag to move, resize with corners`);
  };

  const clickPdf = (e: React.MouseEvent) => {
    if (!placing || !pageRef.current) return;
    if ((e.target as HTMLElement).closest("[data-sign-field]")) return;
    const rect = pageRef.current.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / renderScale;
    const ry = (e.clientY - rect.top) / renderScale;
    placeField(placing, rx, ry, page);
    setPlacing(null);
    setCurrentSignerId(null);
  };

  const deleteField = (id: string) => {
    setFields((f) => f.filter((x) => x.id !== id));
    toast.success("Field removed");
  };

  /* ──────────────────────────────────────── */
  /*  Render field with Rnd (drag + resize) + edit button */
  /* ──────────────────────────────────────── */
  const renderField = (f: PlacedField) => {
    const Icon = f.type === "date" 
      ? Calendar 
      : f.type === "name"
      ? Edit3
      : f.type === "text"
      ? Edit3
      : PenTool;
      
    const bg = f.type === "date" 
      ? "bg-blue-50 border-blue-400" 
      : f.type === "stamp"
      ? "bg-purple-50 border-purple-400"
      : f.type === "name"
      ? "bg-orange-50 border-orange-400"
      : f.type === "text"
      ? "bg-pink-50 border-pink-400"
      : f.type === "checkmark"
      ? "bg-emerald-50 border-emerald-400"
      : f.type === "image"
      ? "bg-slate-50 border-slate-400"
      : "bg-green-50 border-green-400";

    const isEditable = (f.type === "signature" || f.type === "initials") && mode === "single";
    const isTextEditable = f.type === "text";
    const isDateEditable = f.type === "date";

    return (
      <Rnd
        key={f.id}
        data-sign-field={f.id}
        size={{ width: f.width * renderScale, height: f.height * renderScale }}
        position={{ x: f.x * renderScale, y: f.y * renderScale }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onDragStop={(_, d) => {
          setFields((prev) =>
            prev.map((x) => {
              if (x.id !== f.id) return x;
              return clampPlacedFieldToPage(
                {
                  ...x,
                  x: d.x / renderScale,
                  y: d.y / renderScale,
                },
                pdfPagePts[x.page - 1],
              );
            }),
          );
        }}
        onResizeStop={(_e, _dir, ref, _delta, pos) => {
          setFields((prev) =>
            prev.map((x) => {
              if (x.id !== f.id) return x;
              return clampPlacedFieldToPage(
                {
                  ...x,
                  width: parseFloat(ref.style.width) / renderScale,
                  height: parseFloat(ref.style.height) / renderScale,
                  x: pos.x / renderScale,
                  y: pos.y / renderScale,
                },
                pdfPagePts[x.page - 1],
              );
            }),
          );
        }}
        enableResizing={{
          top: true,
          right: true,
          bottom: true,
          left: true,
          topRight: true,
          bottomRight: true,
          bottomLeft: true,
          topLeft: true,
        }}
        lockAspectRatio={f.type === "stamp"}
        bounds="parent"
        minWidth={50}
        minHeight={30}
      >
        <div
          className={`w-full h-full ${bg} border-2 rounded-lg shadow-md p-2 flex items-center justify-center relative group transition-all hover:shadow-lg`}
          style={{ cursor: "move" }}
          onDoubleClick={(e) => {
            if (isTextEditable) {
              e.stopPropagation();
            }
          }}
          onClick={(e) => {
            if (isTextEditable) {
              e.stopPropagation();
            }
          }}
        >
          {f.imageData ? (
            <img 
              src={f.imageData} 
              alt={f.type} 
              className="max-w-full max-h-full object-contain pointer-events-none select-none" 
              draggable={false}
            />
          ) : isTextEditable || isDateEditable ? (
            <input
              type="text"
              value={f.value || ""}
              placeholder={isDateEditable ? "Enter date" : "Type here"}
              onChange={(e) => {
                e.stopPropagation();
                setFields((prev) =>
                  prev.map((x) => (x.id === f.id ? { ...x, value: e.target.value } : x))
                );
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full h-full bg-transparent border-none outline-none text-center text-sm font-medium px-1"
              style={{
                color: f.color || "#000000",
                fontFamily: f.font || "Helvetica",
                fontSize: `${Math.min(14, f.height * 0.35)}px`,
                textTransform: isDateEditable ? "none" : "capitalize",
              }}
              autoFocus={false}
            />
          ) : f.type === "checkmark" ? (
            <span
              className="font-bold select-none leading-none"
              style={{
                color: f.color || "#000000",
                fontSize: `${Math.min(f.width, f.height) * renderScale * 0.7}px`,
              }}
            >
              ✓
            </span>
          ) : (
            <span
              className="text-sm font-medium capitalize select-none"
              style={{
                color: f.color || "#000000",
                fontFamily: f.font || "Helvetica",
                fontSize: `${Math.min(14, f.height * 0.35)}px`,
              }}
            >
              {f.value}
            </span>
          )}

          {f.type !== "checkmark" && (
            <Icon className="absolute top-1 left-1 h-3 w-3 opacity-50" />
          )}
          
          {/* Edit button (only for signatures/initials in single mode) */}
          {isEditable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReSign(f.id);
              }}
              className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
              title="Edit signature"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          )}
          
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteField(f.id);
            }}
            className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
            title="Delete field"
          >
            ×
          </button>

          {/* Resize indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 opacity-0 group-hover:opacity-50 pointer-events-none">
            <div className="w-full h-full border-r-2 border-b-2 border-gray-600" />
          </div>
        </div>
      </Rnd>
    );
  };

  /* ──────────────────────────────────────── */
  /*  Sign → frontend (pdf-lib with images)   */
  /* ──────────────────────────────────────── */
  const startSigning = async () => {
    if (!file) return;
    if (fields.length === 0) {
      toast.error("Place at least one field on the PDF");
      return;
    }

    setStep("processing");
    let prog = 0;
    const int = setInterval(() => {
      prog += Math.random() * 12;
      if (prog > 90) prog = 90;
      setProgress(prog);
    }, 180);

    try {
      if (!pdfBytes) {
        throw new Error("PDF data is missing. Please re-upload the file.");
      }
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();

      const embed = async (src: PlacedField) => {
        const dims = pdfPagePts[src.page - 1];
        const f = clampPlacedFieldToPage(src, dims);
        const p = pages[f.page - 1];
        const pdfY = p.getHeight() - f.y - f.height;

        if (f.imageData) {
          const raw = f.imageData.split(",")[1];
          const bin = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
          let img;
          if (f.imageData.startsWith("data:image/png") || f.imageData.startsWith("data:image/svg+xml")) {
            img = await pdf.embedPng(bin);
          } else {
            img = await pdf.embedJpg(bin);
          }
          p.drawImage(img, { x: f.x, y: pdfY, width: f.width, height: f.height });
        } else if (f.type === "checkmark") {
          // "✓" is not WinAnsi-encodable; ZapfDingbats char "4" is a checkmark glyph.
          const dingbats = await pdf.embedFont(StandardFonts.ZapfDingbats);
          const size = Math.min(f.width, f.height) * 0.8;
          p.drawText("4", {
            x: f.x + (f.width - size) / 2,
            y: pdfY + (f.height - size) / 2,
            size,
            font: dingbats,
            color: f.color ? hexToRgb(f.color) : rgb(0, 0, 0),
          });
        } else if (f.value) {
          const font = await pdf.embedFont(
            f.font === "Times-Roman" ? StandardFonts.TimesRoman : 
            f.font === "Courier" ? StandardFonts.Courier :
            StandardFonts.Helvetica
          );
          const col = f.color ? hexToRgb(f.color) : rgb(0, 0, 0);
          const fontSize = Math.min(14, f.height * 0.6);
          p.drawText(f.value, {
            x: f.x + 5,
            y: pdfY + f.height / 2 - fontSize / 3,
            size: fontSize,
            font,
            color: col,
          });
        }
      };

      for (const f of fields) {
        await embed(f);
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      setSignedUrl(URL.createObjectURL(blob));
      clearInterval(int);
      setProgress(100);
      setTimeout(() => setStep("download"), 400);
      toast.success("PDF signed successfully!");
    } catch (e: any) {
      clearInterval(int);
      setProgress(0);
      setStep("upload");
      toast.error(e.message ?? "Signing failed");
    }
  };

  /* ──────────────────────────────────────── */
  /*  Download (signed blob)                  */
  /* ──────────────────────────────────────── */
  const downloadSigned = () => {
    if (!signedUrl || !file) return;
    triggerBrowserDownload(
      signedUrl,
      buildLexorbitProcessedFilename(file.name, "signed"),
    );
    toast.success("Download started!");
  };

  const reset = () => {
    if (signedUrl) URL.revokeObjectURL(signedUrl);
    setFile(null);
    setPdfBytes(null);
    setNumPages(0);
    setStep("upload");
    setProgress(0);
    setFields([]);
    setSignedUrl(null);
    setMode(null);
    setSigners([]);
    setCurrentSignerId(null);
    setFullSig(null);
    setInitSig(null);
    setPendingImage(null);
    setPdfPagePts([]);
    setFullName("");
    setPlacing(null);
    setEditingFieldId(null);
    setPage(1);
  };

  /* ──────────────────────────────────────── */
  /*  UPLOAD STEP – EXACTLY LIKE StampPDF     */
  /* ──────────────────────────────────────── */
  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <Upload className="h-12 w-8 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF to Sign</h3>
                <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={() => pdfUploadInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Select PDF File
                  </Button>
                  <PdfLibraryPickButton onFileReady={loadPdfFromFile} />
                </div>
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
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPdfBytes(null);
                  setNumPages(0);
                  setPdfPagePts([]);
                  setMode(null);
                  setSigners([]);
                  setFields([]);
                }}
              >
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
        onChange={handleUpload}
      />
    </div>
  );

  /* ──────────────────────────────────────── */
  /*  UI – upload / mode selection            */
  /* ──────────────────────────────────────── */
  const renderUpload = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* LEFT – PDF viewer / upload card */}
      <div className="lg:col-span-3">
        {!file ? (
          renderUploadStep()
        ) : mode === null || showSingleModal || showMultiModal ? (
          /* ---------- CHOOSE WHO SIGNS (hide PDF until signer setup completes) ---------- */
          <div className="flex justify-center">
            <Card className="max-w-3xl w-full">
              <CardContent className="p-8 space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">
                    Who will sign this document?
                  </h2>
                  <p className="text-muted-foreground">
                    Choose how you want to handle signatures
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Card
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all border-2"
                    onClick={() => {
                      setMode("single");
                      setShowSingleModal(true);
                    }}
                  >
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                        <PenTool className="h-8 w-8 text-accent" />
                      </div>
                      <h3 className="text-lg font-semibold">Only me</h3>
                      <p className="text-sm text-muted-foreground">
                        Sign the document yourself quickly and securely with your own signature.
                      </p>
                      <Button variant="outline" className="w-full mt-2">
                        Choose This Option
                      </Button>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all border-2"
                    onClick={() => {
                      setMode("multiple");
                      setSigners([
                        { id: Date.now().toString(), name: "", email: "" },
                        { id: (Date.now() + 1).toString(), name: "", email: "" },
                      ]);
                      setShowMultiModal(true);
                    }}
                  >
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 bg-primary rounded-full border-2 border-white" />
                          <div className="w-6 h-6 bg-accent rounded-full border-2 border-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold">Several people</h3>
                      <p className="text-sm text-muted-foreground">
                        Invite multiple people to sign the document and track their progress.
                      </p>
                      <Button variant="outline" className="w-full mt-3">
                        Choose This Option
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ---------- PDF VIEWER + FIELDS ---------- */
          <Card>
            <CardContent className="p-4 space-y-4">
                  {/* Zoom & page controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))}
                    disabled={scale <= 0.5}
                    title="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[52px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setScale((s) => Math.min(s + 0.1, 2))}
                    disabled={scale >= 2}
                    title="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(1)}
                    disabled={scale === 1}
                    title="Fit page to width"
                  >
                    Fit Width
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    title="Previous page"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Page {page} of {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                    disabled={page >= numPages}
                    title="Next page"
                  >
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>

              {placing && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-center">
                  <strong>Click on the PDF</strong> to place your {placing} field
                </div>
              )}

              {/* PDF container */}
              <div
                ref={pdfContainerRef}
                className={`border-2 rounded-lg bg-gray-50 overflow-auto max-h-[min(70vh,720px)] relative flex justify-center ${
                  placing ? "cursor-crosshair border-primary" : "border-border"
                }`}
                onClick={clickPdf}
              >
                {pdfDocumentFile && containerWidth > 0 ? (
                  <Document
                    file={pdfDocumentFile}
                    onLoadSuccess={onLoadSuccess}
                    onLoadError={onPdfLoadError}
                    loading={
                      <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
                        Loading PDF…
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center p-12 text-sm text-destructive">
                        Failed to load PDF file.
                      </div>
                    }
                  >
                    <div ref={pageRef} style={{ position: "relative", display: "inline-block" }}>
                      <Page
                        pageNumber={page}
                        width={Math.floor(containerWidth * scale)}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                      {fields
                        .filter((f) => f.page === page)
                        .map(renderField)}
                    </div>
                  </Document>
                ) : (
                  <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
                    Preparing PDF preview…
                  </div>
                )}
              </div>

              {/* Pagination */}
              {numPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === numPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT – field palette (only after PDF + mode selected) */}
      {file && mode && signers.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Add Fields
              </h3>

              {/* Multiple signer selector */}
              {mode === "multiple" && (
                <div className="space-y-2">
                  <Label className="text-xs">Select Signer</Label>
                  {signers.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setPlacing("signature");
                        setCurrentSignerId(s.id);
                      }}
                      className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        currentSignerId === s.id
                          ? "bg-accent/10 border-accent shadow-sm"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <PenTool className="h-4 w-4" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">Signature {i + 1}</div>
                        <div className="text-xs text-muted-foreground">{s.name || "Unnamed"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Single-mode buttons */}
              {mode === "single" && (
                <div className="space-y-2">
                  <FieldButton
                    label="Signature"
                    hint="Full signature"
                    icon={<PenTool className="h-4 w-4 text-accent" />}
                    iconBg="bg-accent/20"
                    active={placing === "signature"}
                    activeClass="bg-accent/10 border-accent shadow-sm"
                    hoverClass="hover:border-accent/50"
                    onClick={() => {
                      setPlacing("signature");
                      setCurrentSignerId(signers[0].id);
                    }}
                  />

                  {initSig && (
                    <FieldButton
                      label="Initials"
                      hint={deriveInitials(fullName) || "Short form"}
                      icon={<PenTool className="h-4 w-4 text-accent" />}
                      iconBg="bg-accent/20"
                      active={placing === "initials"}
                      activeClass="bg-accent/10 border-accent shadow-sm"
                      hoverClass="hover:border-accent/50"
                      onClick={() => {
                        setPlacing("initials");
                        setCurrentSignerId(signers[0].id);
                      }}
                    />
                  )}

                  <FieldButton
                    label="Name"
                    hint={fullName || "Your name"}
                    icon={<Edit3 className="h-4 w-4 text-orange-600" />}
                    iconBg="bg-orange-500/20"
                    active={placing === "name"}
                    activeClass="bg-orange-50 border-orange-400 shadow-sm"
                    hoverClass="hover:border-orange-400/50"
                    onClick={() => {
                      setPlacing("name");
                      setCurrentSignerId(signers[0].id);
                    }}
                  />

                  <FieldButton
                    label="Date"
                    hint="Today's date, editable"
                    icon={<Calendar className="h-4 w-4 text-blue-600" />}
                    iconBg="bg-blue-500/20"
                    active={placing === "date"}
                    activeClass="bg-blue-50 border-blue-400 shadow-sm"
                    hoverClass="hover:border-blue-400/50"
                    onClick={() => setPlacing("date")}
                  />

                  <FieldButton
                    label="Text"
                    hint="Custom textbox"
                    icon={<Edit3 className="h-4 w-4 text-pink-600" />}
                    iconBg="bg-pink-500/20"
                    active={placing === "text"}
                    activeClass="bg-pink-50 border-pink-400 shadow-sm"
                    hoverClass="hover:border-pink-400/50"
                    onClick={() => setPlacing("text")}
                  />

                  <FieldButton
                    label="Checkmark"
                    hint="Tick boxes on forms"
                    icon={<span className="text-emerald-600 text-sm font-bold">✓</span>}
                    iconBg="bg-emerald-500/20"
                    active={placing === "checkmark"}
                    activeClass="bg-emerald-50 border-emerald-400 shadow-sm"
                    hoverClass="hover:border-emerald-400/50"
                    onClick={() => setPlacing("checkmark")}
                  />

                  <FieldButton
                    label="Image"
                    hint={pendingImage ? "Click PDF to place" : "Logo, photo, ID"}
                    icon={<Upload className="h-4 w-4 text-slate-600" />}
                    iconBg="bg-slate-500/20"
                    active={placing === "image"}
                    activeClass="bg-slate-50 border-slate-400 shadow-sm"
                    hoverClass="hover:border-slate-400/50"
                    onClick={() => {
                      if (pendingImage) {
                        setPlacing("image");
                      } else {
                        imageFieldInputRef.current?.click();
                      }
                    }}
                  />
                  <input
                    ref={imageFieldInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => {
                        const data = r.result as string;
                        const img = new Image();
                        img.onload = () => {
                          const w = 150;
                          setPendingImage({
                            data,
                            width: w,
                            height: w / (img.naturalWidth / img.naturalHeight),
                          });
                          setPlacing("image");
                          toast.success("Image ready – click on the PDF to place it");
                        };
                        img.src = data;
                      };
                      r.readAsDataURL(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              )}

              {/* Date button for multiple-signer mode */}
              {mode === "multiple" && (
                <FieldButton
                  label="Date"
                  hint="Today's date, editable"
                  icon={<Calendar className="h-4 w-4 text-blue-600" />}
                  iconBg="bg-blue-500/20"
                  active={placing === "date"}
                  activeClass="bg-blue-50 border-blue-400 shadow-sm"
                  hoverClass="hover:border-blue-400/50"
                  onClick={() => setPlacing("date")}
                />
              )}

              {/* Placed items */}
              {fields.length > 0 && (
                <div className="pt-3 border-t space-y-1.5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Placed Items
                  </h4>
                  {fields.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 text-sm rounded-md px-2 py-1.5 bg-muted/40 group"
                    >
                      <span className="text-emerald-600 font-bold">✓</span>
                      <button
                        type="button"
                        className="flex-1 text-left capitalize hover:underline"
                        title={`Go to page ${f.page}`}
                        onClick={() => setPage(f.page)}
                      >
                        {f.type}
                        <span className="text-xs text-muted-foreground ml-1.5">
                          p.{f.page}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                        onClick={() => deleteField(f.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t space-y-2">
                <Button
                  onClick={startSigning}
                  className="w-full h-auto min-h-11 whitespace-normal text-sm px-3"
                  size="lg"
                  disabled={fields.length === 0}
                >
                  {fields.length === 0 ? (
                    "Place a field to continue"
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2 shrink-0" />
                      Download Signed PDF
                    </>
                  )}
                </Button>
                {fields.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Click a field above, then click on the PDF to place it.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/pdf-tools")} 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Sign PDF</h1>
            <p className="text-muted-foreground mt-1">
              Add signatures, initials, and dates to your documents
            </p>
          </div>
        </div>

        {/* Steps */}
        {step === "upload" && renderUpload()}

        {step === "processing" && (
          <div className="max-w-xl mx-auto text-center">
            <Card>
              <CardContent className="p-12 space-y-6">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <PenTool className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Signing your PDF…</h3>
                  <p className="text-sm text-muted-foreground">
                    Processing document with your signatures
                  </p>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "download" && file && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-accent">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                  <Download className="h-10 w-10 text-accent" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Signing Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your PDF has been signed successfully. Download it now.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-5 border">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-sm">PDF</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium">
                        {buildLexorbitProcessedFilename(file.name, "signed")}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="outline" size="icon" onClick={reset} className="h-12 w-12">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <Button onClick={downloadSigned} size="lg" className="px-8">
                    <Download className="h-5 w-5 mr-2" /> 
                    Download Signed PDF
                  </Button>

                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={reset} 
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

        {/* ──────────────────────── SINGLE SIGNER MODAL ──────────────────────── */}
        <Dialog
          open={showSingleModal}
          onOpenChange={(open) => {
            setShowSingleModal(open);
            if (!open && signers.length === 0) {
              setMode(null);
            }
          }}
        >
          <DialogContent className={SIGNATURE_DIALOG_SHELL_CLASS}>
            <DialogHeader className={SIGNATURE_DIALOG_HEADER_CLASS}>
              <DialogTitle>Create Signature</DialogTitle>
            </DialogHeader>

            <div className={SIGNATURE_DIALOG_BODY_CLASS} onKeyDown={preventDialogEnterSubmit}>
              <div className="space-y-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-1.5"
                  />
                  {fullName.trim() && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Initials: <span className="font-medium">{deriveInitials(fullName)}</span>{" "}
                      (auto-generated)
                    </p>
                  )}
                </div>

                <SignatureCreator
                  embedded
                  saveRef={signatureSaveRef}
                  onSave={setFullSig}
                  initialName={fullName}
                />
              </div>
            </div>

            <div className={SIGNATURE_DIALOG_FOOTER_CLASS}>
              <Button
                type="button"
                variant="outline"
                className="sm:min-w-[100px]"
                onClick={() => {
                  setShowSingleModal(false);
                  signatureSaveRef.current = null;
                  if (signers.length === 0) setMode(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="sm:min-w-[140px]"
                onClick={() => void handleApplySignature()}
                disabled={!fullName.trim()}
              >
                Apply Signature
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ──────────────────────── MULTIPLE SIGNERS MODAL ──────────────────────── */}
        <Dialog
          open={showMultiModal}
          onOpenChange={(open) => {
            setShowMultiModal(open);
            if (!open && signers.filter((s) => s.name.trim()).length < 2) {
              setMode(null);
            }
          }}
        >
          <DialogContent className={`${SIGNATURE_DIALOG_SHELL_CLASS} max-w-xl`}>
            <DialogHeader className={SIGNATURE_DIALOG_HEADER_CLASS}>
              <DialogTitle>Add Multiple Signers</DialogTitle>
            </DialogHeader>
            <div className={SIGNATURE_DIALOG_BODY_CLASS} onKeyDown={preventDialogEnterSubmit}>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Optional: add a shared signature image used for all signers when placing fields.
                </p>
                {!fullSig ? (
                  <SignatureCreator
                    embedded
                    saveRef={sharedSignatureSaveRef}
                    onSave={(cfg) => {
                      setFullSig(cfg);
                      sharedSignatureSaveRef.current = null;
                      toast.success("Shared signature saved");
                    }}
                    saveButtonLabel="Save Shared Signature"
                    initialName="Signature"
                  />
                ) : (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Shared signature ready. You can place fields after adding signers.
                  </p>
                )}
                {signers.map((s, i) => (
                  <div key={s.id} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder={`Signer ${i + 1} name *`}
                        value={s.name}
                        onChange={(e) => updateSigner(s.id, "name", e.target.value)}
                      />
                      <Input
                        placeholder="Email (optional)"
                        type="email"
                        value={s.email ?? ""}
                        onChange={(e) => updateSigner(s.id, "email", e.target.value)}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSigner(s.id)}
                      disabled={signers.length <= 2}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addSigner}>
                  + Add Another Signer
                </Button>
              </div>
            </div>
            <div className={SIGNATURE_DIALOG_FOOTER_CLASS}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowMultiModal(false);
                  sharedSignatureSaveRef.current = null;
                  if (signers.filter((s) => s.name.trim()).length < 2) setMode(null);
                }}
              >
                Cancel
              </Button>
              {!fullSig && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    const cfg = await sharedSignatureSaveRef.current?.();
                    if (cfg) {
                      setFullSig(cfg);
                      sharedSignatureSaveRef.current = null;
                      toast.success("Shared signature saved");
                    } else {
                      toast.error("Create a shared signature first");
                    }
                  }}
                >
                  Save Shared Signature
                </Button>
              )}
              <Button type="button" onClick={finishMulti}>
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ──────────────────────── RE-SIGN MODAL ──────────────────────── */}
        <ReSignModal
          isOpen={showReSignModal}
          onClose={() => {
            setShowReSignModal(false);
            setEditingFieldId(null);
          }}
          fieldType={
            editingFieldId 
              ? (fields.find(f => f.id === editingFieldId)?.type === "signature" ? "signature" : "initials") 
              : "signature"
          }
          currentValue={editingFieldId ? fields.find(f => f.id === editingFieldId)?.value : undefined}
          onSave={saveReSign}
        />
      </div>
    </div>
  );
};

/* ──────────────────────────────────────── */
/*  Helper – hex → pdf-lib rgb              */
/* ──────────────────────────────────────── */
const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
};

export default SignPDF;