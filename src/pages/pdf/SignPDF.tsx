/* ────────────────────────────────────────────────────────────────────────── */
/*  SignPDF.tsx – frontend-only version with full drag/resize/re-sign       */
/*  UPLOAD UI NOW IDENTICAL TO StampPDF (only visual change)                */
/* ────────────────────────────────────────────────────────────────────────── */
import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";
import { Document, Page, pdfjs } from "react-pdf";
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

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ProcessStep = "upload" | "processing" | "download";
type FieldType = "signature" | "initials" | "date" | "stamp" | "name" | "text";

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
/*  Font options with proper font families                                */
/* ────────────────────────────────────────────────────────────────────── */
const FONT_OPTIONS = [
  { value: "Alex Brush", label: "Alex", style: "font-alex-brush" },
  { value: "Allura", label: "Allura", style: "font-allura" },
  { value: "Mrs Saint Delafield", label: "Handle", style: "font-mrs-saint-delafield" },
  { value: "Kristi", label: "Kristi", style: "font-kristi" },
  { value: "Italianno", label: "Lassie", style: "font-italianno" },
  { value: "Mr Dafoe", label: "Mark", style: "font-mr-dafoe" },
  { value: "Satisfy", label: "Satisfy", style: "font-satisfy" },
  { value: "Zeyada", label: "Zeyada", style: "font-zeyada" },
  { value: "Shadows Into Light", label: "Shadows", style: "font-shadows-into-light" },
];

/* ────────────────────────────────────────────────────────────────────── */
/*  SignatureCreator – type / draw / upload / 12 presets                 */
/*  → Shows the typed name inside every preset preview                     */
/*  → Font selector now shows visual preview of each font                  */
/* ────────────────────────────────────────────────────────────────────── */
const SignatureCreator = ({
  onSave,
  initialName,
}: {
  onSave: (cfg: SignatureConfig) => void;
  initialName: string;
}) => {
  const [method, setMethod] = useState<"type" | "draw" | "upload" | "preset">("type");
  const [text, setText] = useState(initialName);
  const [color, setColor] = useState("#000000");
  const [font, setFont] = useState("Helvetica");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const [lineW, setLineW] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const DRAW_W = 480;
  const DRAW_H = 160;

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

  /* ---------- TYPE ---------- */
  const saveTyped = () => {
    if (!text.trim()) {
      toast.error("Please enter your signature text");
      return;
    }
    
    // Create a canvas to render the text as an image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const fontSize = 48;
    canvas.width = Math.max(text.length * fontSize * 0.6 + 40, 200);
    canvas.height = fontSize + 40;
    
    // Set font with the selected Google Font
    ctx.font = `${fontSize}px "${font}", cursive`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Draw text
    ctx.fillText(text, 20, canvas.height / 2);
    
    // Convert to image data
    const imageData = canvas.toDataURL('image/png');
    
    onSave({ 
      type: "image", 
      content: imageData, 
      width: canvas.width / 2, 
      height: canvas.height / 2 
    });
  };

  /* ---------- DRAW ---------- */
  const canvasPointFromEvent = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
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
    const x = ((cx - rect.left) / rect.width) * DRAW_W;
    const y = ((cy - rect.top) / rect.height) * DRAW_H;
    return { x, y };
  };

  const start = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
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
  const move = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = canvasPointFromEvent(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stop = () => setDrawing(false);
  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, DRAW_W, DRAW_H);
  };
  const saveDrawn = () => {
    const data = canvasRef.current?.toDataURL("image/png") ?? "";
    if (!data || data === "data:,") {
      toast.error("Please draw your signature first");
      return;
    }
    onSave({ type: "image", content: data, width: 200, height: 60 });
  };

  /* ---------- UPLOAD ---------- */
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
        const h = w / ratio;
        onSave({ type: "image", content: data, width: w, height: h });
      };
      img.src = data;
    };
    r.readAsDataURL(f);
  };


  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["type", "draw", "upload"] as const).map((m) => (
          <button
            key={m}
            className={`px-4 py-2 capitalize text-sm font-medium transition-colors ${
              method === m 
                ? "border-b-2 border-primary text-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setMethod(m)}
          >
            {m === "type" ? "Type" : m === "draw" ? "Draw" : "Upload"}
          </button>
        ))}
      </div>

      {/* TYPE */}
      {method === "type" && (
        <div className="space-y-4">
          <div>
            <Label>Your Signature Text</Label>
            <Input 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="Enter your name" 
              className="mt-1.5"
            />
          </div>
          
          {/* Color picker */}
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 items-center mt-1.5">
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="w-12 h-12 rounded-md border cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>

          {/* Font selector with visual preview */}
          <div>
            <Label>Font Style</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {FONT_OPTIONS.map((fontOption) => (
                <button
                  key={fontOption.value}
                  onClick={() => setFont(fontOption.value)}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    font === fontOption.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`text-lg ${fontOption.style}`} style={{ color }}>
                    {text || "Sample"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {fontOption.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {text && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
              <div className="flex items-center justify-center py-4">
                <span 
                  className={FONT_OPTIONS.find(f => f.value === font)?.style}
                  style={{ 
                    color, 
                    fontSize: '24px',
                    fontWeight: font === 'Helvetica' ? 400 : 'normal'
                  }}
                >
                  {text}
                </span>
              </div>
            </div>
          )}

          <Button onClick={saveTyped} className="w-full">
            Save Signature
          </Button>
        </div>
      )}

      {/* DRAW */}
      {method === "draw" && (
        <div className="space-y-3">
          <Label>Draw Your Signature</Label>
          <canvas
            ref={canvasRef}
            width={DRAW_W}
            height={DRAW_H}
            className="border-2 border-dashed border-border w-full max-w-xl bg-white rounded-lg cursor-crosshair touch-none h-44 mx-auto block"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={stop}
            onTouchCancel={stop}
            style={{ touchAction: "none" }}
          />
          <div className="flex gap-2 items-center">
            <input 
              type="color" 
              value={penColor} 
              onChange={(e) => setPenColor(e.target.value)} 
              className="w-12 h-12 rounded-md border cursor-pointer"
            />
            <div className="flex-1">
              <Label className="text-xs">Pen Width</Label>
              <input 
                type="range" 
                min={1} 
                max={8} 
                value={lineW} 
                onChange={(e) => setLineW(+e.target.value)} 
                className="w-full"
              />
            </div>
            <Button variant="outline" size="sm" onClick={clear}>
              Clear
            </Button>
          </div>
          <Button onClick={saveDrawn} className="w-full">
            Save Signature
          </Button>
        </div>
      )}

      {/* UPLOAD */}
      {method === "upload" && (
        <div className="space-y-3">
          <Label>Upload Signature Image</Label>
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handleUpload} 
            className="hidden" 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Image File
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            PNG, JPG, or SVG format supported
          </p>
        </div>
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
  const [localName, setLocalName] = useState(currentValue || "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update {fieldType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder={`Enter ${fieldType}`}
          />
          <SignatureCreator
            onSave={(cfg) => {
              onSave(cfg);
              onClose();
            }}
            initialName={localName}
          />
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
/*  Main component                                                       */
/* ────────────────────────────────────────────────────────────────────── */
const SignPDF = () => {
  const navigate = useNavigate();

  /* ---------- Core state ---------- */
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.30);
  const pageRef = useRef<HTMLDivElement>(null);
  const pdfUploadInputRef = useRef<HTMLInputElement>(null); // NEW REF

  const [mode, setMode] = useState<"single" | "multiple" | null>(null);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [currentSignerId, setCurrentSignerId] = useState<string | null>(null);

  /* ---------- Signature configs ---------- */
  const [fullSig, setFullSig] = useState<SignatureConfig | null>(null);
  const [initSig, setInitSig] = useState<SignatureConfig | null>(null);
  const [stampImg, setStampImg] = useState<string | null>(null);

  /* ---------- Modals ---------- */
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [showReSignModal, setShowReSignModal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [initials, setInitials] = useState("");
  const [activeTab, setActiveTab] = useState<"signature" | "initials" | "stamp">("signature");

  /* ---------- Fields ---------- */
  const [fields, setFields] = useState<PlacedField[]>([]);
  const [placing, setPlacing] = useState<FieldType | null>(null);

  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const [pdfPagePts, setPdfPagePts] = useState<Array<{ width: number; height: number }>>([]);

  /* ──────────────────────────────────────── */
  /*  PDF upload & validation                 */
  /* ──────────────────────────────────────── */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ok = await isValidPDF(f);
    if (!ok) {
      toast.error("Invalid PDF file");
      return;
    }
    setPdfPagePts([]);
    setFile(f);
    setMode(null);
    setSigners([]);
    setFields([]);
    setFullSig(null);
    setInitSig(null);
    setStampImg(null);
    setPage(1);
    toast.success("PDF uploaded successfully");
    e.target.value = "";
  };

  const isValidPDF = async (f: File) => {
    if (f.size === 0 || f.size > 100 * 1024 * 1024) return false;
    const head = await f.slice(0, 5).arrayBuffer();
    const view = new Uint8Array(head);
    return view[0] === 0x25 && view[1] === 0x50 && view[2] === 0x44 && view[3] === 0x46 && view[4] === 0x2d;
  };

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    toast.success(`PDF loaded – ${numPages} page(s)`);
  };

  useEffect(() => {
    let cancelled = false;
    async function loadDims() {
      if (!file) {
        setPdfPagePts([]);
        return;
      }
      try {
        const raw = await file.arrayBuffer();
        const doc = await PDFDocument.load(raw);
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
  }, [file]);

  /* ──────────────────────────────────────── */
  /*  Single signer – save name + signatures  */
  /* ──────────────────────────────────────── */
  const finishSingle = () => {
    if (!fullName.trim() || !fullSig) {
      toast.error("Name & signature required");
      return;
    }
    setSigners([{ id: "single-1", name: fullName.trim() }]);
    setShowSingleModal(false);
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
            value: "Double-click to edit",
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
    } else {
      // single mode
      if (type === "signature") cfg = fullSig;
      else if (type === "initials") cfg = initSig;
      else if (type === "stamp") {
        imageData = stampImg ?? undefined;
        w = 150;
        h = 150;
      }

      if (!cfg && type !== "stamp") {
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
    const rect = pageRef.current.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / scale;
    const ry = (e.clientY - rect.top) / scale;
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
      : "bg-green-50 border-green-400";

    const isEditable = (f.type === "signature" || f.type === "initials") && mode === "single";
    const isTextEditable = f.type === "text";

    return (
      <Rnd
        key={f.id}
        size={{ width: f.width * scale, height: f.height * scale }}
        position={{ x: f.x * scale, y: f.y * scale }}
        onDragStop={(_, d) => {
          setFields((prev) =>
            prev.map((x) => {
              if (x.id !== f.id) return x;
              return clampPlacedFieldToPage(
                {
                  ...x,
                  x: d.x / scale,
                  y: d.y / scale,
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
                  width: parseFloat(ref.style.width) / scale,
                  height: parseFloat(ref.style.height) / scale,
                  x: pos.x / scale,
                  y: pos.y / scale,
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
              const newText = prompt("Edit text:", f.value || "");
              if (newText !== null) {
                setFields((prev) =>
                  prev.map((x) => (x.id === f.id ? { ...x, value: newText } : x))
                );
                toast.success("Text updated");
              }
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
          ) : (
            <span
              className="text-sm font-medium capitalize select-none"
              style={{ 
                color: f.color || "#000000", 
                fontFamily: f.font || "Helvetica",
                fontSize: `${Math.min(14, f.height * 0.35)}px`
              }}
            >
              {f.value}
            </span>
          )}
          
          <Icon className="absolute top-1 left-1 h-3 w-3 opacity-50" />
          
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
    const sigs = fields.filter((f) => f.type === "signature" || f.type === "initials");
    if (sigs.length === 0) {
      toast.error("Place at least one signature field");
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
      const arr = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arr);
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
    const a = document.createElement("a");
    a.href = signedUrl;
    // Remove .pdf extension if it exists to prevent double extension
    const nameWithoutPdf = file.name.endsWith('.pdf') ? file.name.slice(0, -4) : file.name;
    a.download = `signed_${nameWithoutPdf}.pdf`;
    a.click();
    toast.success("Download started!");
  };

  const reset = () => {
    if (signedUrl) URL.revokeObjectURL(signedUrl);
    setFile(null);
    setStep("upload");
    setProgress(0);
    setFields([]);
    setSignedUrl(null);
    setMode(null);
    setSigners([]);
    setCurrentSignerId(null);
    setFullSig(null);
    setInitSig(null);
    setStampImg(null);
    setPdfPagePts([]);
    setFullName("");
    setInitials("");
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
                  {(file.size / 1024 / 1024).toFixed(2)} MB
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
        ) : mode === null ? (
          /* ---------- CHOOSE WHO SIGNS ---------- */
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
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
                    disabled={scale <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setScale((s) => Math.min(s + 0.2, 2))}
                    disabled={scale >= 2}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  Page {page} of {numPages}
                </div>
              </div>

              {placing && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-center">
                  <strong>Click on the PDF</strong> to place your {placing} field
                </div>
              )}

              {/* PDF container */}
              <div
                className={`border-2 rounded-lg bg-gray-50 overflow-auto max-h-[620px] relative ${
                  placing ? "cursor-crosshair border-primary" : "border-border"
                }`}
                onClick={clickPdf}
              >
                <Document file={file} onLoadSuccess={onLoadSuccess}>
                  <div ref={pageRef} style={{ position: "relative", display: "inline-block" }}>
                    <Page
                      pageNumber={page}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                    {fields
                      .filter((f) => f.page === page)
                      .map(renderField)}
                  </div>
                </Document>
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
                  <button
                    onClick={() => {
                      setPlacing("signature");
                      setCurrentSignerId(signers[0].id);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      placing === "signature"
                        ? "bg-accent/10 border-accent shadow-sm"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                      <PenTool className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">Signature</div>
                      <div className="text-xs text-muted-foreground">Full signature</div>
                    </div>
                  </button>

                  {initSig && (
                    <button
                      onClick={() => {
                        setPlacing("initials");
                        setCurrentSignerId(signers[0].id);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        placing === "initials"
                          ? "bg-accent/10 border-accent shadow-sm"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                        <PenTool className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">Initials</div>
                        <div className="text-xs text-muted-foreground">Short form</div>
                      </div>
                    </button>
                  )}

                  {/* Company Stamp button - opens modal if no stamp, or places if stamp exists */}
                  {stampImg ? (
                    <button
                      onClick={() => {
                        setPlacing("stamp");
                        setCurrentSignerId(signers[0].id);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        placing === "stamp"
                          ? "bg-purple-50 border-purple-400 shadow-sm"
                          : "border-border hover:border-purple-400/50"
                      }`}
                    >
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 text-xs font-bold">S</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">Company Stamp</div>
                        <div className="text-xs text-muted-foreground">Official seal</div>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveTab("stamp");
                        setShowSingleModal(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-border hover:border-purple-400/50 transition-all"
                    >
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 text-xs font-bold">+</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">Add Company Stamp</div>
                        <div className="text-xs text-muted-foreground">Create official seal</div>
                      </div>
                    </button>
                  )}

                  {/* Name button - uses name from signature creation */}
                  <button
                    onClick={() => {
                      setPlacing("name");
                      setCurrentSignerId(signers[0].id);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      placing === "name"
                        ? "bg-orange-50 border-orange-400 shadow-sm"
                        : "border-border hover:border-orange-400/50"
                    }`}
                  >
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Edit3 className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">Name</div>
                      <div className="text-xs text-muted-foreground">{fullName || "Your name"}</div>
                    </div>
                  </button>

                  {/* Text button - editable textbox */}
                  <button
                    onClick={() => setPlacing("text")}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      placing === "text"
                        ? "bg-pink-50 border-pink-400 shadow-sm"
                        : "border-border hover:border-pink-400/50"
                    }`}
                  >
                    <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <Edit3 className="h-4 w-4 text-pink-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">Text</div>
                      <div className="text-xs text-muted-foreground">Custom textbox</div>
                    </div>
                  </button>
                </div>
              )}

              <button
                onClick={() => setPlacing("date")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  placing === "date"
                    ? "bg-blue-50 border-blue-400 shadow-sm"
                    : "border-border hover:border-blue-400/50"
                }`}
              >
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">Date</div>
                  <div className="text-xs text-muted-foreground">Today's date</div>
                </div>
              </button>

              <div className="pt-4 border-t">
                <Button
                  onClick={startSigning}
                  className="w-full"
                  size="lg"
                  disabled={fields.filter((f) => f.type !== "date").length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Sign PDF
                </Button>
              </div>

              {fields.length > 0 && (
                <div className="text-xs text-center text-muted-foreground space-y-1 pt-2">
                  <p className="font-medium">{fields.length} field(s) placed</p>
                  <p>Drag to move • Corners to resize • Hover for actions</p>
                </div>
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
                        signed_{file.name.endsWith('.pdf') ? file.name.slice(0, -4) : file.name}.pdf
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
        <Dialog open={showSingleModal} onOpenChange={setShowSingleModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Your Signature</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Name & Initials */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Full Name *</Label>
                  <Input 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="John Doe" 
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Initials (optional)</Label>
                  <Input 
                    value={initials} 
                    onChange={(e) => setInitials(e.target.value)} 
                    placeholder="JD" 
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                {(["signature", "initials", "stamp"] as const).map((t) => (
                  <button
                    key={t}
                    className={`px-4 py-2 capitalize transition-colors ${
                      activeTab === t 
                        ? "border-b-2 border-primary text-primary font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setActiveTab(t)}
                  >
                    {t === "signature" ? "Signature" : t === "initials" ? "Initials" : "Company Stamp"}
                  </button>
                ))}
              </div>

              {/* Signature creator */}
              {activeTab === "signature" && (
                <SignatureCreator
                  onSave={(cfg) => {
                    setFullSig(cfg);
                    toast.success("Signature saved");
                  }}
                  initialName={fullName}
                />
              )}

              {/* Initials creator */}
              {activeTab === "initials" && (
                <SignatureCreator
                  onSave={(cfg) => {
                    setInitSig(cfg);
                    toast.success("Initials saved");
                  }}
                  initialName={initials}
                />
              )}

              {/* Company stamp */}
              {activeTab === "stamp" && (
                <div className="space-y-3">
                  <Label>Upload Company Stamp</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => {
                        setStampImg(r.result as string);
                        toast.success("Stamp uploaded");
                      };
                      r.readAsDataURL(f);
                    }}
                    className="mt-1.5"
                  />
                  {stampImg && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                      <img 
                        src={stampImg} 
                        alt="stamp preview" 
                        className="max-h-40 mx-auto rounded" 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSingleModal(false)}>
                Cancel
              </Button>
              <Button onClick={finishSingle} disabled={!fullSig || !fullName.trim()}>
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ──────────────────────── MULTIPLE SIGNERS MODAL ──────────────────────── */}
        <Dialog open={showMultiModal} onOpenChange={setShowMultiModal}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Multiple Signers</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
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
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowMultiModal(false)}>
                Cancel
              </Button>
              <Button onClick={finishMulti}>
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