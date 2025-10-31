'use client';

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  memo,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Download,
  Check,
  Type,
  Image as ImageIcon,
  FileText,
  Settings2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

/* ---------- react-pdf ---------- */
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ProcessStep = "upload" | "customize" | "processing" | "download";
type WatermarkType = "text" | "image";

/* ------------------------------------------------------------------ */
/* Hook – load PDF once and keep the pdfjs document in a ref          */
/* ------------------------------------------------------------------ */
const usePDFDocument = (file: File | null) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPdfDoc(null);
      setNumPages(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [file]);

  return { pdfDoc, numPages, loading, error };
};

/* ------------------------------------------------------------------ */
/* Page overlay – pure component, only re-renders on watermark change*/
/* ------------------------------------------------------------------ */
const PageOverlay = memo(
  ({
    pageIndex,
    watermarkType,
    watermarkText,
    fontSize,
    fontFamily,
    textColor,
    rotation,
    opacity,
    imageUrl,
    positionX,
    positionY,
    pageWidth,
    pageHeight,
  }: {
    pageIndex: number;
    watermarkType: WatermarkType;
    watermarkText: string;
    fontSize: number;
    fontFamily: string;
    textColor: string;
    rotation: number;
    opacity: number;
    imageUrl: string | null;
    positionX: number;
    positionY: number;
    pageWidth: number;
    pageHeight: number;
  }) => {
    const overlayKey = `${watermarkType}-${watermarkText}-${fontSize}-${fontFamily}-${textColor}-${rotation}-${opacity}-${imageUrl}-${positionX}-${positionY}-${pageWidth}-${pageHeight}`;

    return (
      <div
        key={overlayKey}
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 10 }}
      >
        {watermarkType === "text" && watermarkText && (
          <div
            style={{
              position: "absolute",
              left: `${positionX}%`,
              top: `${positionY}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              fontSize: `${(fontSize * pageWidth) / 1000}px`, // Scale font based on actual page
              fontFamily:
                fontFamily === "Helvetica"
                  ? "sans-serif"
                  : fontFamily === "Times"
                  ? "serif"
                  : "monospace",
              color: textColor,
              opacity: opacity / 100,
              fontWeight: "bold",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {watermarkText}
          </div>
        )}

        {watermarkType === "image" && imageUrl && (
          <img
            src={imageUrl}
            alt="watermark"
            style={{
              position: "absolute",
              left: `${positionX}%`,
              top: `${positionY}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              width: `${(200 * pageWidth) / 1000}px`, // Scale image
              height: "auto",
              opacity: opacity / 100,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    );
  }
);
PageOverlay.displayName = "PageOverlay";

/* ------------------------------------------------------------------ */
/* Live preview – shows all pages, but only stamps selected ones     */
/* ------------------------------------------------------------------ */
const PDFLivePreview = memo(
  ({
    file,
    totalPages,
    watermarkSettings,
    applyToAllPages,
    pageRangeFrom,
    pageRangeTo,
    selectedPages,
  }: {
    file: File;
    totalPages: number;
    watermarkSettings: any;
    applyToAllPages: boolean;
    pageRangeFrom: number;
    pageRangeTo: number;
    selectedPages: Set<number>;
  }) => {
    const { pdfDoc, loading, error } = usePDFDocument(file);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

    /* Resize observer */
    useEffect(() => {
      if (!containerRef.current) return;
      const ro = new ResizeObserver((entries) => {
        const w = entries[0].contentRect.width;
        if (Math.abs(w - containerWidth) > 5) setContainerWidth(w);
      });
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }, [containerWidth]);

    /* Get page dimensions */
    const onRenderSuccess = useCallback((pageIndex: number, page: any) => {
      const viewport = page.getViewport({ scale: 1 });
      setPageDimensions(prev => new Map(prev).set(pageIndex, { width: viewport.width, height: viewport.height }));
    }, []);

    if (!pdfDoc) return null;

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-white overflow-auto rounded-lg shadow-inner"
        style={{ overflowX: "hidden" }}
      >
        <Document file={file} loading={null}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isSelected = selectedPages.has(pageNum);
            const dims = pageDimensions.get(pageNum) || { width: 800, height: 1000 };

            return (
              <div
                key={pageNum}
                className={`mb-6 relative ${!isSelected ? "opacity-40" : ""}`}
                style={{ filter: !isSelected ? "grayscale(50%)" : "none" }}
              >
                <Page
                  pageNumber={pageNum}
                  width={containerWidth || undefined}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={null}
                  className="shadow-md"
                  onRenderSuccess={(page) => onRenderSuccess(pageNum, page)}
                  canvasProps={{
                    style: { width: "100%", height: "auto" },
                  }}
                />
                {isSelected && (
                  <PageOverlay
                    pageIndex={pageNum}
                    {...watermarkSettings}
                    pageWidth={dims.width}
                    pageHeight={dims.height}
                  />
                )}
              </div>
            );
          })}
        </Document>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="text-lg font-medium text-muted-foreground">
              Loading PDF...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-600 p-4">
            <p className="font-medium">Failed to load PDF</p>
            <p className="text-sm mt-1 max-w-md text-center">{error}</p>
          </div>
        )}
      </div>
    );
  }
);
PDFLivePreview.displayName = "PDFLivePreview";

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */
const StampPDF = () => {
  const navigate = useNavigate();

  /* ---------- Core state ---------- */
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);

  const [watermarkType, setWatermarkType] = useState<WatermarkType>("text");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState<
    "Helvetica" | "Times" | "Courier"
  >("Helvetica");
  const [textColor, setTextColor] = useState("#000000");
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(50);
  const [imageWatermark, setImageWatermark] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);

  const [applyToAllPages, setApplyToAllPages] = useState(true);
  const [pageRangeFrom, setPageRangeFrom] = useState(1);
  const [pageRangeTo, setPageRangeTo] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [watermarkedPdf, setWatermarkedPdf] = useState<Uint8Array | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Selected pages set ---------- */
  const selectedPages = useMemo(() => {
    const set = new Set<number>();
    if (applyToAllPages) {
      for (let i = 1; i <= totalPages; i++) set.add(i);
    } else {
      for (let i = pageRangeFrom; i <= pageRangeTo; i++) {
        if (i >= 1 && i <= totalPages) set.add(i);
      }
    }
    return set;
  }, [applyToAllPages, pageRangeFrom, pageRangeTo, totalPages]);

  /* ---------- Image preview URL ---------- */
  useEffect(() => {
    if (imageWatermark) {
      const url = URL.createObjectURL(imageWatermark);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [imageWatermark]);

  /* ---------- Watermark settings object for memoization ---------- */
  const watermarkSettings = useMemo(
    () => ({
      watermarkType,
      watermarkText,
      fontSize,
      fontFamily,
      textColor,
      rotation,
      opacity,
      imageUrl,
      positionX,
      positionY,
    }),
    [
      watermarkType,
      watermarkText,
      fontSize,
      fontFamily,
      textColor,
      rotation,
      opacity,
      imageUrl,
      positionX,
      positionY,
    ]
  );

  /* ---------- PDF upload ---------- */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || f.type !== "application/pdf") {
      toast.error("Please select a valid PDF file");
      return;
    }

    setFile(f);
    try {
      const buf = await f.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      const pages = pdf.getPages();
      const numPages = pages.length;
      setTotalPages(numPages);
      setPageRangeFrom(1);
      setPageRangeTo(numPages);
      toast.success(`PDF loaded – ${numPages} page${numPages > 1 ? "s" : ""}`);
      setCurrentStep("customize");
    } catch (err) {
      console.error(err);
      toast.error("Failed to read PDF");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const img = e.target.files?.[0];
    if (img && img.type.startsWith("image/")) {
      setImageWatermark(img);
      toast.success("Image uploaded");
    } else {
      toast.error("Select a valid image");
    }
  };

  /* ---------- Watermark processing – EXACT POSITIONING ---------- */
  const hexToRgb = (hex: string) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? {
          r: parseInt(m[1], 16) / 255,
          g: parseInt(m[2], 16) / 255,
          b: parseInt(m[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };

  const applyWatermark = async () => {
    if (!file) return toast.error("Upload a PDF first");
    if (watermarkType === "text" && !watermarkText)
      return toast.error("Enter text");
    if (watermarkType === "image" && !imageWatermark)
      return toast.error("Upload an image");

    setCurrentStep("processing");
    setProgress(10);

    try {
      const buf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const pages = pdfDoc.getPages();

      setProgress(30);

      const indices: number[] = Array.from(selectedPages).map(p => p - 1);

      setProgress(50);

      if (watermarkType === "text") {
        const fontMap = {
          Helvetica: StandardFonts.HelveticaBold,
          Times: StandardFonts.TimesRomanBold,
          Courier: StandardFonts.CourierBold,
        };
        const font = await pdfDoc.embedFont(fontMap[fontFamily]);
        const col = hexToRgb(textColor);

        for (const i of indices) {
          const page = pages[i];
          const { width, height } = page.getSize();
          const x = (positionX / 100) * width;
          const y = (positionY / 100) * height;

          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(col.r, col.g, col.b),
            rotate: degrees(rotation),
            opacity: opacity / 100,
          });
        }
      } else if (watermarkType === "image" && imageWatermark) {
        const imgBuf = await imageWatermark.arrayBuffer();
        const img =
          imageWatermark.type === "image/png"
            ? await pdfDoc.embedPng(imgBuf)
            : await pdfDoc.embedJpg(imgBuf);

        for (const i of indices) {
          const page = pages[i];
          const { width, height } = page.getSize();
          const imgW = 200;
          const imgH = (img.height / img.width) * imgW;
          const x = (positionX / 100) * width - imgW / 2;
          const y = (positionY / 100) * height - imgH / 2;

          page.drawImage(img, {
            x,
            y,
            width: imgW,
            height: imgH,
            rotate: degrees(rotation),
            opacity: opacity / 100,
          });
        }
      }

      setProgress(80);
      const bytes = await pdfDoc.save();
      setWatermarkedPdf(bytes);
      setProgress(100);
      setTimeout(() => setCurrentStep("download"), 600);
    } catch (err) {
      console.error(err);
      toast.error("Watermark failed");
      setCurrentStep("customize");
    }
  };

  const downloadFile = () => {
    if (!watermarkedPdf) return;
    const blob = new Blob([watermarkedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watermarked_${file?.name ?? "doc.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const reset = () => {
    setFile(null);
    setWatermarkedPdf(null);
    setCurrentStep("upload");
    setProgress(0);
    setWatermarkText("CONFIDENTIAL");
    setImageWatermark(null);
    setImageUrl(null);
  };

  /* ---------- Render steps ---------- */
  const renderUpload = () => (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-12 text-center">
          <div className="border-2 border-dashed rounded-xl p-12 bg-muted/30 hover:bg-muted/50 transition-colors">
            <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Upload PDF to Stamp</p>
            <p className="text-sm text-muted-foreground mb-6">
              Drag & drop your PDF here, or click to browse and select a file
              from your computer.
            </p>
            <Button
              size="lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-5 w-5 mr-2" />
              Select PDF
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomize = () => (
    <div className="grid lg:grid-cols-[1.4fr,0.8fr] gap-6 h-full w-full">
      {/* LEFT – PDF PREVIEW (Wider) */}
      <div className="flex flex-col h-full">
        <Card className="flex flex-col h-full">
          <CardContent className="p-0 flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b bg-background">
              <h3 className="font-semibold">Live Preview</h3>
              <span className="text-sm text-muted-foreground">
                {applyToAllPages
                  ? totalPages > 1
                    ? `All ${totalPages} pages`
                    : "Page 1"
                  : `Pages ${pageRangeFrom}–${pageRangeTo}`}
              </span>
            </div>
            <div className="flex-1 min-h-0 bg-muted/10 overflow-hidden">
              {file && (
                <PDFLivePreview
                  file={file}
                  totalPages={totalPages}
                  watermarkSettings={watermarkSettings}
                  applyToAllPages={applyToAllPages}
                  pageRangeFrom={pageRangeFrom}
                  pageRangeTo={pageRangeTo}
                  selectedPages={selectedPages}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT – SETTINGS (Compressed, No Scroll) */}
      <div className="flex flex-col h-full space-y-3 max-w-sm mx-auto w-full">
        {/* File info */}
        <Card className="shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{file?.name}</h4>
              <p className="text-xs text-muted-foreground">
                {totalPages} pages
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              Change
            </Button>
          </CardContent>
        </Card>

        {/* Watermark type */}
        <Card className="shadow-sm">
          <CardContent className="p-3">
            <Tabs
              value={watermarkType}
              onValueChange={(v) => setWatermarkType(v as WatermarkType)}
            >
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="text" className="text-xs">
                  <Type className="h-3 w-3 mr-1" /> Text
                </TabsTrigger>
                <TabsTrigger value="image" className="text-xs">
                  <ImageIcon className="h-3 w-3 mr-1" /> Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-3 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Text</Label>
                  <Input
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Font</Label>
                    <Select value={fontFamily} onValueChange={(v) => setFontFamily(v as any)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times">Times</SelectItem>
                        <SelectItem value="Courier">Courier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Size</Label>
                    <Input
                      type="number"
                      min={12}
                      max={120}
                      value={fontSize}
                      onChange={(e) => setFontSize(+e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-8 p-0.5"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="image" className="mt-3">
                <div className="border border-dashed rounded-lg p-4 text-center">
                  {imageWatermark ? (
                    <div className="space-y-2">
                      <div className="w-16 h-16 mx-auto bg-muted rounded overflow-hidden">
                        <img
                          src={URL.createObjectURL(imageWatermark)}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs font-medium truncate">{imageWatermark.name}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="h-8 mx-auto text-muted-foreground mb-2" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <Upload className="h-3 w-3 mr-1" /> Upload
                      </Button>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Position & Rotation */}
        <Card className="shadow-sm">
          <CardContent className="p-3 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <Settings2 className="h-3 w-3" /> Position
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">X (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={positionX}
                  onChange={(e) => setPositionX(+e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={positionY}
                  onChange={(e) => setPositionY(+e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Rotate</Label>
                <Input
                  type="number"
                  min={-180}
                  max={180}
                  value={rotation}
                  onChange={(e) => setRotation(+e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Opacity</Label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(+e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages */}
        <Card className="shadow-sm">
          <CardContent className="p-3">
            <h3 className="text-sm font-medium mb-2">Pages</h3>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">All pages</Label>
              <Switch
                checked={applyToAllPages}
                onCheckedChange={setApplyToAllPages}
              />
            </div>
            {!applyToAllPages && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageRangeFrom}
                    onChange={(e) => {
                      const val = +e.target.value;
                      if (val >= 1 && val <= totalPages) {
                        setPageRangeFrom(val);
                        if (val > pageRangeTo) setPageRangeTo(val);
                      }
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageRangeTo}
                    onChange={(e) => {
                      const val = +e.target.value;
                      if (val >= 1 && val <= totalPages) {
                        setPageRangeTo(val);
                        if (val < pageRangeFrom) setPageRangeFrom(val);
                      }
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply button */}
        <Button
          className="w-full h-10 text-sm font-medium"
          onClick={applyWatermark}
        >
          Apply Watermark
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Settings2 className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">Applying Watermark…</h3>
          <p className="text-muted-foreground">{file?.name}</p>
          <Progress value={progress} className="h-3" />
          <div className="text-3xl font-bold text-primary">
            {Math.round(progress)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDownload = () => (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold">Done!</h3>
          <p className="text-muted-foreground">
            Your watermarked PDF is ready
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={downloadFile}>
              <Download className="h-5 w-5 mr-2" /> Download PDF
            </Button>
            <Button variant="outline" size="lg" onClick={reset}>
              Watermark Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <div className="max-w-6xl mx-auto pt-6 pb-10 px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              currentStep === "upload" ? navigate(-1) : setCurrentStep("upload")
            }
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
<h1 className="text-3xl font-bold">Stamp PDF</h1>
            <p className="text-muted-foreground">
              Stamp text or an image over your PDF in seconds
            </p>
          </div>
        </div>

        {currentStep === "upload" && renderUpload()}
        {currentStep === "customize" && renderCustomize()}
        {currentStep === "processing" && renderProcessing()}
        {currentStep === "download" && renderDownload()}
      </div>
    </div>
  );
};

export default StampPDF;