/* ────────────────────────────────────────────────────────────────────────── */
/*  SignPDF.tsx – frontend-only version with full drag/resize/re-sign       */
/* ────────────────────────────────────────────────────────────────────────── */
import { useState, useRef, useEffect, useCallback } from "react";
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
type FieldType = "signature" | "initials" | "date" | "stamp";

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
/*  12 preset signatures (cursive, block, elegant, …)                     */
/* ────────────────────────────────────────────────────────────────────── */
const PRESET_SIGNATURES = [
  { name: "Cursive",   svg: `<svg viewBox="0 0 220 70"><path d="M10 35 Q30 15 50 35 T90 35 Q110 55 130 35 T170 35 Q190 55 210 35" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>` },
  { name: "Elegant",   svg: `<svg viewBox="0 0 220 70"><path d="M10 40 Q40 20 70 40 T130 40 Q160 60 190 40 T210 40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { name: "Block",     svg: `<svg viewBox="0 0 220 70"><text x="10" y="45" font-family="Arial" font-weight="bold" font-size="42" fill="currentColor">JS</text></svg>` },
  { name: "Italic",    svg: `<svg viewBox="0 0 220 70"><text x="10" y="45" font-family="Times New Roman" font-style="italic" font-size="42" fill="currentColor">JS</text></svg>` },
  { name: "Simple",    svg: `<svg viewBox="0 0 220 70"><text x="10" y="45" font-family="Helvetica" font-size="38" fill="currentColor">JS</text></svg>` },
  { name: "Fancy",     svg: `<svg viewBox="0 0 220 70"><path d="M10 35 Q35 15 60 35 T110 35 Q135 55 160 35 T210 35" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>` },
  { name: "Bold",      svg: `<svg viewBox="0 0 220 70"><text x="10" y="45" font-family="Impact" font-size="44" fill="currentColor">JS</text></svg>` },
  { name: "Script",    svg: `<svg viewBox="0 0 220 70"><path d="M10 40 Q30 20 50 40 T90 40 Q110 60 130 40 T170 40 Q190 60 210 40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { name: "Modern",    svg: `<svg viewBox="0 0 220 70"><text x="10" y="45" font-family="Verdana" font-weight="600" font-size="40" fill="currentColor">JS</text></svg>` },
  { name: "Handwrite", svg: `<svg viewBox="0 0 220 70"><path d="M10 35 Q28 18 45 35 Q62 52 80 35 Q98 18 115 35 Q133 52 150 35 Q168 18 185 35 Q203 52 210 35" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>` },
  { name: "Minimal",   svg: `<svg viewBox="0 0 220 70"><text x="10" y="45" font-family="Courier New" font-size="38" fill="currentColor">JS</text></svg>` },
  { name: "Signature", svg: `<svg viewBox="0 0 220 70"><path d="M10 35 Q35 15 60 35 T110 35 Q135 55 160 35 T210 35" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>` },
];

/* ────────────────────────────────────────────────────────────────────── */
/*  SignatureCreator – type / draw / upload / 12 presets                 */
/*  → Shows the typed name inside every preset preview                     */
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
    const w = Math.max(text.length * 9 + 30, 120);
    onSave({ type: "text", content: text, color, font, width: w, height: 36 });
  };

  /* ---------- DRAW ---------- */
  const start = (e: React.MouseEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400;
    const y = ((e.clientY - rect.top) / rect.height) * 120;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: React.MouseEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 400;
    const y = ((e.clientY - rect.top) / rect.height) * 120;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stop = () => setDrawing(false);
  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, 400, 120);
  };
  const saveDrawn = () => {
    const data = canvasRef.current?.toDataURL("image/png") ?? "";
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

  /* ---------- PRESET – render typed name inside SVG ---------- */
  const renderPreset = (svg: string) => {
    // Replace placeholder "JS" with the actual typed name
    const withName = svg.replace(/JS|John Doe/g, text || "Name");
    const colored = withName.replace(/currentColor/g, color);
    return colored;
  };

  const choosePreset = (svg: string) => {
    const colored = renderPreset(svg);
    const data = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(colored)))}`;
    onSave({ type: "image", content: data, width: 220, height: 70 });
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["type", "draw", "upload", "preset"] as const).map((m) => (
          <button
            key={m}
            className={`px-4 py-2 capitalize text-sm font-medium ${method === m ? "border-b-2 border-primary" : ""}`}
            onClick={() => setMethod(m)}
          >
            {m === "type" ? "Type" : m === "draw" ? "Draw" : m === "upload" ? "Upload" : "Samples"}
          </button>
        ))}
      </div>

      {/* TYPE */}
      {method === "type" && (
        <div className="space-y-3">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Your signature" />
          <div className="flex gap-2 items-center">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-12 rounded border" />
            <select value={font} onChange={(e) => setFont(e.target.value)} className="flex-1 p-2 border rounded">
              <option value="Helvetica">Helvetica</option>
              <option value="Times-Roman">Times Roman</option>
              <option value="Courier">Courier</option>
              <option value="Arial">Arial</option>
            </select>
          </div>
          <Button onClick={saveTyped} className="w-full bg-primary">Save Signature</Button>
        </div>
      )}

      {/* DRAW */}
      {method === "draw" && (
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            width={400}
            height={120}
            className="border-2 border-gray-300 w-full bg-white rounded"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={stop}
            onMouseLeave={stop}
            style={{ touchAction: "none" }}
          />
          <div className="flex gap-2 items-center">
            <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="w-12 h-12 rounded border" />
            <input type="range" min={1} max={6} value={lineW} onChange={(e) => setLineW(+e.target.value)} className="flex-1" />
            <Button variant="outline" size="sm" onClick={clear}>Clear</Button>
          </div>
          <Button onClick={saveDrawn} className="w-full bg-primary">Save Signature</Button>
        </div>
      )}

      {/* UPLOAD */}
      {method === "upload" && (
        <div className="space-y-3">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} className="w-full bg-primary">Choose Image</Button>
        </div>
      )}

      {/* PRESET SAMPLES – show typed name inside */}
      {method === "preset" && (
        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
          {PRESET_SIGNATURES.map((p, i) => (
            <button
              key={i}
              className="border rounded p-2 hover:bg-muted transition flex flex-col items-center"
              onClick={() => choosePreset(p.svg)}
            >
              <div
                dangerouslySetInnerHTML={{ __html: renderPreset(p.svg) }}
                style={{ width: "100%", height: 50 }}
              />
              <p className="text-xs mt-1">{p.name}</p>
            </button>
          ))}
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
  currentColor,
  currentFont,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  fieldType: "signature" | "initials";
  currentValue?: string;
  currentColor?: string;
  currentFont?: string;
  onSave: (cfg: SignatureConfig) => void;
}) => {
  const [localName, setLocalName] = useState(currentValue || "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Re-{fieldType} this field</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder={`Your ${fieldType}`}
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
  const [scale, setScale] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);

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

  /* ──────────────────────────────────────── */
  /*  PDF upload & validation                 */
  /* ──────────────────────────────────────── */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ok = await isValidPDF(f);
    if (!ok) { toast.error("Invalid PDF"); return; }
    setFile(f);
    setMode(null);
    setSigners([]);
    setFields([]);
    setFullSig(null);
    setInitSig(null);
    setStampImg(null);
    toast.success("PDF uploaded – choose who will sign");
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

  /* ──────────────────────────────────────── */
  /*  Single signer – save name + signatures  */
  /* ──────────────────────────────────────── */
  const finishSingle = () => {
    if (!fullName.trim() || !fullSig) {
      toast.error("Name & signature required");
      return;
    }
    setSigners([{ id: "single-1", name: fullName.trim() }]);
    if (initials.trim() && initSig) setInitSig(initSig);
    setShowSingleModal(false);
    toast.success("Ready – place fields on the PDF");
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
    toast.success("Signers saved – now place fields");
  };

  /* ──────────────────────────────────────── */
  /*  Handle re-signing for a placed field    */
  /* ──────────────────────────────────────── */
  const handleReSign = (fieldId: string, fieldType: "signature" | "initials") => {
    setEditingFieldId(fieldId);
    setShowReSignModal(true);
  };

  const saveReSign = (cfg: SignatureConfig) => {
    if (!editingFieldId) return;
    let signerName = "";
    if (mode === "multiple") {
      const signer = signers.find(s => s.id === fields.find(f => f.id === editingFieldId)?.signerId);
      signerName = signer?.name || "";
    } else {
      signerName = fullName;
    }
    if (cfg.type === "text") {
      setFields(prev => prev.map(f => 
        f.id === editingFieldId 
          ? { ...f, value: cfg.content, color: cfg.color, font: cfg.font, width: cfg.width || f.width, height: cfg.height || f.height }
          : f
      ));
    } else {
      setFields(prev => prev.map(f => 
        f.id === editingFieldId 
          ? { ...f, value: signerName, imageData: cfg.content, width: cfg.width || f.width, height: cfg.height || f.height }
          : f
      ));
    }
    toast.success(`${fieldType} updated`);
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

    if (type === "date") {
      value = new Date().toLocaleDateString("en-US");
    } else if (mode === "multiple") {
      if (!currentSignerId) { toast.error("Select a signer first"); return; }
      const s = signers.find((s) => s.id === currentSignerId);
      if (!s?.name) { toast.error("Signer name missing"); return; }
      value = s.name;
      signerId = currentSignerId;
    } else {
      // single
      if (type === "signature") cfg = fullSig;
      else if (type === "initials") cfg = initSig;
      else if (type === "stamp") { imageData = stampImg ?? undefined; w = 150; h = 150; }

      if (!cfg && type !== "stamp") { toast.error(`Create a ${type} first`); return; }
      signerId = signers[0]?.id;

      if (cfg?.type === "text") {
        value = cfg.content;
        color = cfg.color;
        font = cfg.font;
        w = cfg.width ?? 150;
        h = cfg.height ?? 40;
      } else if (cfg?.type === "image") {
        imageData = cfg.content;
        w = cfg.width ?? 200;
        h = cfg.height ?? 60;
      }
    }

    const f: PlacedField = {
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
    };
    setFields((prev) => [...prev, f]);
    toast.success(`${type} added – drag / resize / re-sign`);
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
    const Icon = f.type === "date" ? Calendar : PenTool;
    const bg = f.type === "date" ? "bg-blue-100 border-blue-400" : "bg-green-100 border-green-400";

    const isEditable = (f.type === "signature" || f.type === "initials") && (mode === "single" || mode === "multiple");

    return (
      <Rnd
        key={f.id}
        size={{ width: f.width * scale, height: f.height * scale }}
        position={{ x: f.x * scale, y: f.y * scale }}
        onDragStop={(e, d) => {
          setFields((prev) =>
            prev.map((x) =>
              x.id === f.id ? { ...x, x: d.x / scale, y: d.y / scale } : x
            )
          );
        }}
        onResizeStop={(e, dir, ref, delta, pos) => {
          setFields((prev) =>
            prev.map((x) =>
              x.id === f.id
                ? {
                    ...x,
                    width: parseFloat(ref.style.width) / scale,
                    height: parseFloat(ref.style.height) / scale,
                    x: pos.x / scale,
                    y: pos.y / scale,
                  }
                : x
            )
          );
        }}
        enableResizing
        lockAspectRatio={f.type === "stamp"}
        bounds="parent"
      >
        <div
          className={`w-full h-full ${bg} border-2 rounded shadow-lg p-1 flex items-center justify-center relative group`}
          style={{ cursor: "move" }}
        >
          {f.imageData ? (
            <img src={f.imageData} alt="" className="max-w-full max-h-full object-contain pointer-events-none" />
          ) : (
            <span
              className="text-sm font-medium capitalize select-none"
              style={{ color: f.color, fontFamily: f.font }}
            >
              {f.value}
            </span>
          )}
          <Icon className="absolute top-1 left-1 h-4 w-4 opacity-70" />
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (isEditable) {
                handleReSign(f.id, f.type as "signature" | "initials");
              } else {
                deleteField(f.id);
              }
            }}
            className={`absolute -top-2 -right-2 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition ${
              isEditable ? "bg-blue-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {isEditable ? <Edit3 className="h-3 w-3" /> : "×"}
          </button>
          {!isEditable && (
            <button
              onClick={(e) => { e.stopPropagation(); deleteField(f.id); }}
              className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              ×
            </button>
          )}
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
    if (sigs.length === 0) { toast.error("Place at least one signature"); return; }

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

      const embed = async (f: PlacedField) => {
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
            f.font === "Times-Roman" ? StandardFonts.TimesRoman : StandardFonts.Helvetica
          );
          const col = f.color ? hexToRgb(f.color) : rgb(0, 0, 0);
          p.drawText(f.value, {
            x: f.x,
            y: pdfY + f.height / 2 - 6, // Adjust for baseline
            size: Math.min(12, f.height * 0.6),
            font,
            color: col,
          });
        }
      };

      for (const f of fields) {
        await embed(f);
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setSignedUrl(URL.createObjectURL(blob));
      clearInterval(int);
      setProgress(100);
      setTimeout(() => setStep("download"), 400);
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
    a.download = `signed_${file.name}`;
    a.click();
    toast.success("Downloaded!");
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
    setFullName("");
    setInitials("");
    setPlacing(null);
    setEditingFieldId(null);
  };

  /* ──────────────────────────────────────── */
  /*  UI – upload / mode selection            */
  /* ──────────────────────────────────────── */
  const renderUpload = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* LEFT – PDF viewer / upload card */}
      <div className="lg:col-span-3">
        {!file ? (
          /* ---------- UPLOAD CARD ---------- */
          <Card className="border-2 border-dashed h-96 flex items-center justify-center">
            <CardContent className="text-center space-y-4">
              <Upload className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">Upload PDF to Sign</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Drag & drop your PDF here, or click to select a file.
              </p>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                onClick={() => document.getElementById("pdf-upload")?.click()}
                size="lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Select PDF
              </Button>
            </CardContent>
          </Card>
        ) : mode === null ? (
          /* ---------- CHOOSE WHO SIGNS ---------- */
          <div className="flex justify-center">
            <Card className="max-w-3xl w-full">
              <CardContent className="p-8 space-y-6">
                <h2 className="text-2xl font-bold text-center">
                  Who will sign this document?
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card
                    className="cursor-pointer hover:border-primary/50 transition"
                    onClick={() => {
                      setMode("single");
                      setShowSingleModal(true);
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <h3 className="text-lg font-semibold mb-2">Only me</h3>
                      <p className="text-muted-foreground mb-4">
                        Sign the document yourself quickly and securely.
                      </p>
                      <Button variant="outline" className="w-full">
                        Choose Only me
                      </Button>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:border-primary/50 transition"
                    onClick={() => {
                      setMode("multiple");
                      setSigners([
                        { id: Date.now().toString(), name: "", email: "" },
                        { id: (Date.now() + 1).toString(), name: "", email: "" },
                      ]);
                      setShowMultiModal(true);
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <h3 className="text-lg font-semibold mb-2">Several people</h3>
                      <p className="text-muted-foreground mb-4">
                        Invite others to sign in sequence and track progress.
                      </p>
                      <Button variant="outline" className="w-full">
                        Choose Several people
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setScale((s) => Math.min(s + 0.2, 2))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Page {page} / {numPages}
                </div>
              </div>

              {/* PDF container */}
              <div
                className={`border rounded-lg bg-gray-100 overflow-auto max-h-[620px] relative ${
                  placing ? "cursor-crosshair" : ""
                }`}
                onClick={clickPdf}
              >
                <Document file={file} onLoadSuccess={onLoadSuccess}>
                  <div ref={pageRef} style={{ position: "relative" }}>
                    <Page
                      pageNumber={page}
                      scale={scale}
                      renderTextLayer
                      renderAnnotationLayer
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
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === numPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
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
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-sm">Fields</h3>

              {/* Multiple signer selector */}
              {mode === "multiple" && (
                <div className="space-y-2 mb-3">
                  {signers.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setPlacing("signature");
                        setCurrentSignerId(s.id);
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded border ${
                        currentSignerId === s.id
                          ? "bg-green-100 border-green-400"
                          : "border-gray-300"
                      }`}
                    >
                      <PenTool className="h-4 w-4" />
                      <span className="text-sm">
                        Signature {i + 1} – {s.name || "Unnamed"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Single-mode buttons */}
              {mode === "single" && (
                <>
                  <button
                    onClick={() => {
                      setPlacing("signature");
                      setCurrentSignerId(signers[0].id);
                    }}
                    className="w-full flex items-center gap-2 p-2 mb-2 bg-green-50 border-2 border-green-400 rounded hover:bg-green-100"
                  >
                    <PenTool className="h-4 w-4" />
                    <span className="text-sm font-medium">Signature</span>
                  </button>

                  {initSig && (
                    <button
                      onClick={() => {
                        setPlacing("initials");
                        setCurrentSignerId(signers[0].id);
                      }}
                      className="w-full flex items-center gap-2 p-2 mb-2 bg-green-50 border-2 border-green-400 rounded hover:bg-green-100 text-xs"
                    >
                      <PenTool className="h-4 w-4" />
                      <span className="text-sm font-medium">Initials</span>
                    </button>
                  )}

                  {stampImg && (
                    <button
                      onClick={() => {
                        setPlacing("stamp");
                        setCurrentSignerId(signers[0].id);
                      }}
                      className="w-full flex items-center gap-2 p-2 mb-2 bg-purple-50 border-2 border-purple-400 rounded hover:bg-purple-100"
                    >
                      <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs">S</span>
                      </div>
                      <span className="text-sm font-medium">Company Stamp</span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => setPlacing("date")}
                className="w-full flex items-center gap-2 p-2 bg-blue-50 border border-blue-400 rounded hover:bg-blue-100"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Date</span>
              </button>

              <Button
                onClick={startSigning}
                className="w-full mt-4"
                disabled={fields.filter((f) => f.type !== "date").length === 0}
              >
                Sign PDF (Frontend)
              </Button>

              {fields.length > 0 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {fields.length} field(s) placed – drag to move, resize handles, edit button for re-sign
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sign PDF</h1>
            <p className="text-muted-foreground">Upload and place signature & date fields on your PDF – all frontend.</p>
          </div>
        </div>

        {/* Steps */}
        {step === "upload" && renderUpload()}

        {step === "processing" && (
          <div className="max-w-xl mx-auto text-center">
            <Card>
              <CardContent className="p-12 space-y-6">
                <p className="font-semibold text-xl">Signing your PDF… (Frontend)</p>
                <Progress value={progress} className="w-1/2 mx-auto" />
              </CardContent>
            </Card>
          </div>
        )}

        {step === "download" && file && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-primary">
              <CardContent className="p-8 text-center space-y-6">
                <h3 className="text-xl font-semibold">Signing Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Your PDF has been signed locally. Download it now.
                </p>

                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs">PDF</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium">signed_{file.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB (approx)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={reset} className="h-12 w-12">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <Button onClick={downloadSigned} className="bg-primary hover:bg-primary/90 h-12 px-8">
                    <Download className="h-4 w-4 mr-2" /> Download Signed PDF
                  </Button>

                  <Button variant="outline" size="icon" onClick={reset} className="h-12 w-12 text-destructive">
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Set your signature details</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Name & Initials */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <Label>Initials (optional)</Label>
                  <Input value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="JD" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                {(["signature", "initials", "stamp"] as const).map((t) => (
                  <button
                    key={t}
                    className={`px-4 py-2 capitalize ${activeTab === t ? "border-b-2 border-primary font-medium" : ""}`}
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
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => setStampImg(r.result as string);
                      r.readAsDataURL(f);
                      toast.success("Stamp uploaded");
                    }}
                  />
                  {stampImg && <img src={stampImg} alt="stamp preview" className="max-h-40 mx-auto rounded border" />}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSingleModal(false)}>Cancel</Button>
              <Button onClick={finishSingle} disabled={!fullSig}>Apply</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ──────────────────────── MULTIPLE SIGNERS MODAL ──────────────────────── */}
        <Dialog open={showMultiModal} onOpenChange={setShowMultiModal}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add signers</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {signers.map((s, i) => (
                <div key={s.id} className="flex gap-2 items-center">
                  <Input
                    placeholder={`Signer ${i + 1} name`}
                    value={s.name}
                    onChange={(e) => updateSigner(s.id, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={s.email ?? ""}
                    onChange={(e) => updateSigner(s.id, "email", e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="destructive" size="icon" onClick={() => removeSigner(s.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addSigner}>
                + Add another signer
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMultiModal(false)}>Cancel</Button>
              <Button onClick={finishMulti}>Save signers</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ──────────────────────── RE-SIGN MODAL ──────────────────────── */}
        <ReSignModal
          isOpen={showReSignModal}
          onClose={() => setShowReSignModal(false)}
          fieldType={editingFieldId ? (fields.find(f => f.id === editingFieldId)?.type === "signature" ? "signature" : "initials") : "signature"}
          currentValue={editingFieldId ? fields.find(f => f.id === editingFieldId)?.value : undefined}
          currentColor={editingFieldId ? fields.find(f => f.id === editingFieldId)?.color : undefined}
          currentFont={editingFieldId ? fields.find(f => f.id === editingFieldId)?.font : undefined}
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