'use client';

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  memo,
} from "react";
import { Button } from "@/components/ui/button";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";
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
  Grid3x3,
  Layers,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  PDFDocument,
} from "pdf-lib";
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
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { pdfjs } from "@/lib/pdfjsWorker";
import {
  buildLexorbitProcessedFilename,
  triggerBlobDownload,
} from "@/utils/lexorbitFilename";
import { PdfLibraryPickButton } from "@/components/library/LibraryFileSourceButtons";
import {
  DEFAULT_STAMP_TEXT,
  MOSAIC_POSITIONS,
  composeStampedPage,
  pngBytesToObjectUrl,
  previewRenderScale,
  stampComposeOptionsFromSettings,
  stampPreviewCacheKey,
  type StampComposeOptions,
} from "@/utils/stampPdfCompositor";

type ProcessStep = "upload" | "customize" | "processing" | "download";
type WatermarkType = "text" | "image";

type StampSettings = StampComposeOptions;

/* ------------------------------------------------------------------ */
/* On-top stamp — CSS overlay only (instant, no PDF re-render)        */
/* ------------------------------------------------------------------ */
const OnTopStampOverlay = memo(
  ({
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
    mosaicMode,
    previewScale = 1,
  }: Omit<StampSettings, "behindContent"> & { previewScale?: number }) => {
    const positions = mosaicMode ? MOSAIC_POSITIONS : [{ x: positionX, y: positionY }];

    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        {positions.map((pos, index) => (
          <div key={index}>
            {watermarkType === "text" && watermarkText && (
              <div
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                  fontSize: `${fontSize * previewScale}px`,
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
                alt=""
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                  width: `${200 * previewScale}px`,
                  height: "auto",
                  opacity: opacity / 100,
                }}
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>
    );
  },
);
OnTopStampOverlay.displayName = "OnTopStampOverlay";

/* ------------------------------------------------------------------ */
/* PDF page canvas — memoized so toggles never re-render the PDF      */
/* ------------------------------------------------------------------ */
const MemoizedPdfPage = memo(
  ({
    pageNumber,
    width,
    onDimensions,
  }: {
    pageNumber: number;
    width: number;
    onDimensions: (pageNumber: number, width: number, height: number) => void;
  }) => (
    <Page
      pageNumber={pageNumber}
      width={width}
      renderTextLayer={false}
      renderAnnotationLayer={false}
      loading={null}
      className="shadow-md"
      onRenderSuccess={(page) => {
        const vp = page.getViewport({ scale: 1 });
        onDimensions(pageNumber, vp.width, vp.height);
      }}
    />
  ),
  (prev, next) => prev.pageNumber === next.pageNumber && prev.width === next.width,
);
MemoizedPdfPage.displayName = "MemoizedPdfPage";

/* ------------------------------------------------------------------ */
/* Behind-content preview — canvas compose, keeps previous image        */
/* ------------------------------------------------------------------ */
const BehindContentPreview = memo(
  ({
    pdfDoc,
    pageNumber,
    displayWidth,
    composeOptions,
    onReadyChange,
  }: {
    pdfDoc: PDFDocumentProxy;
    pageNumber: number;
    displayWidth: number;
    composeOptions: StampComposeOptions;
    onReadyChange: (ready: boolean) => void;
  }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const urlRef = useRef<string | null>(null);
    const cacheKey = stampPreviewCacheKey(composeOptions);

    useEffect(() => {
      onReadyChange(!!previewUrl);
    }, [previewUrl, onReadyChange]);

    useEffect(() => {
      let cancelled = false;
      const timer = window.setTimeout(async () => {
        try {
          const scale = previewRenderScale(612, displayWidth);
          const behindOptions: StampComposeOptions = {
            ...composeOptions,
            behindContent: true,
          };
          const { pngBytes } = await composeStampedPage(
            pdfDoc,
            pageNumber - 1,
            behindOptions,
            scale,
          );
          if (cancelled) return;
          const url = pngBytesToObjectUrl(pngBytes);
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          urlRef.current = url;
          setPreviewUrl(url);
        } catch (err) {
          console.error("Behind-content preview failed:", err);
        }
      }, 200);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }, [pdfDoc, pageNumber, displayWidth, cacheKey, composeOptions]);

    useEffect(
      () => () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        onReadyChange(false);
      },
      [onReadyChange],
    );

    if (!previewUrl) return null;

    return (
      <img
        src={previewUrl}
        alt=""
        className="absolute top-0 left-0 z-10 shadow-md block max-w-full h-auto pointer-events-none"
        style={{ width: displayWidth }}
        draggable={false}
      />
    );
  },
);
BehindContentPreview.displayName = "BehindContentPreview";

/* ------------------------------------------------------------------ */
/* Single page slot — PDF stable; only overlay / compose layer changes */
/* ------------------------------------------------------------------ */
const PreviewPageSlot = memo(
  ({
    pageNumber,
    displayWidth,
    isSelected,
    stampSettings,
    pdfDoc,
    onDimensions,
  }: {
    pageNumber: number;
    displayWidth: number;
    isSelected: boolean;
    stampSettings: StampSettings;
    pdfDoc: PDFDocumentProxy | null;
    onDimensions: (pageNumber: number, width: number, height: number) => void;
  }) => {
    const dimsRef = useRef({ width: 612, height: 792 });
    const [behindPreviewReady, setBehindPreviewReady] = useState(false);
    const previewScale =
      displayWidth && dimsRef.current.width
        ? displayWidth / dimsRef.current.width
        : 1;

    const handleDimensions = (num: number, w: number, h: number) => {
      dimsRef.current = { width: w, height: h };
      onDimensions(num, w, h);
    };

    const useBehind = isSelected && stampSettings.behindContent && pdfDoc;
    const hideBasePage = useBehind && behindPreviewReady;

    return (
      <div
        className={`relative mb-6 ${!isSelected ? "opacity-40 grayscale-[50%]" : ""}`}
      >
        <div className={hideBasePage ? "invisible" : undefined}>
          <MemoizedPdfPage
            pageNumber={pageNumber}
            width={displayWidth}
            onDimensions={handleDimensions}
          />
        </div>
        {isSelected && !stampSettings.behindContent && (
          <OnTopStampOverlay
            watermarkType={stampSettings.watermarkType}
            watermarkText={stampSettings.watermarkText}
            fontSize={stampSettings.fontSize}
            fontFamily={stampSettings.fontFamily}
            textColor={stampSettings.textColor}
            rotation={stampSettings.rotation}
            opacity={stampSettings.opacity}
            imageUrl={stampSettings.imageUrl}
            positionX={stampSettings.positionX}
            positionY={stampSettings.positionY}
            mosaicMode={stampSettings.mosaicMode}
            previewScale={previewScale}
          />
        )}
        {useBehind && (
          <BehindContentPreview
            pdfDoc={pdfDoc}
            pageNumber={pageNumber}
            displayWidth={displayWidth}
            composeOptions={stampSettings}
            onReadyChange={setBehindPreviewReady}
          />
        )}
      </div>
    );
  },
);
PreviewPageSlot.displayName = "PreviewPageSlot";

/* ------------------------------------------------------------------ */
/* Live preview                                                       */
/* ------------------------------------------------------------------ */
const PDFLivePreview = memo(
  ({
    file,
    totalPages,
    stampSettings,
    selectedPages,
  }: {
    file: File;
    totalPages: number;
    stampSettings: StampSettings;
    selectedPages: Set<number>;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const pageDimensionsRef = useRef<Map<number, { width: number; height: number }>>(
      new Map(),
    );
    const [, bumpDims] = useState(0);

    useEffect(() => {
      if (!containerRef.current) return;
      const ro = new ResizeObserver((entries) => {
        const w = entries[0].contentRect.width;
        if (w > 0) setContainerWidth(w);
      });
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      let cancelled = false;
      let doc: PDFDocumentProxy | null = null;

      file.arrayBuffer()
        .then((buf) => pdfjs.getDocument({ data: buf.slice(0) }).promise)
        .then((loaded) => {
          if (cancelled) {
            loaded.destroy();
            return;
          }
          doc = loaded;
          setPdfDoc(loaded);
        })
        .catch((err) => console.error("Preview PDF load failed:", err));

      return () => {
        cancelled = true;
        doc?.destroy();
        setPdfDoc(null);
      };
    }, [file]);

    const handleDimensions = (pageNumber: number, w: number, h: number) => {
      const prev = pageDimensionsRef.current.get(pageNumber);
      if (prev?.width === w && prev?.height === h) return;
      pageDimensionsRef.current.set(pageNumber, { width: w, height: h });
      bumpDims((n) => n + 1);
    };

    const displayWidth = containerWidth || 400;

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-white overflow-auto rounded-lg shadow-inner"
      >
        <Document
          file={file}
          loading={
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              Loading PDF…
            </div>
          }
          error={
            <div className="flex items-center justify-center p-12 text-destructive">
              Failed to load PDF
            </div>
          }
        >
          <div className="flex flex-col items-center py-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PreviewPageSlot
                key={pageNum}
                pageNumber={pageNum}
                displayWidth={displayWidth}
                isSelected={selectedPages.has(pageNum)}
                stampSettings={stampSettings}
                pdfDoc={pdfDoc}
                onDimensions={handleDimensions}
              />
            ))}
          </div>
        </Document>
      </div>
    );
  },
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
  const [watermarkText, setWatermarkText] = useState(DEFAULT_STAMP_TEXT);
  const [fontSize, setFontSize] = useState(27);
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

  // NEW: Mosaic and Behind Content options
  const [mosaicMode, setMosaicMode] = useState(false);
  const [behindContent, setBehindContent] = useState(false);

  const [applyToAllPages, setApplyToAllPages] = useState(true);
  const [pageRangeFrom, setPageRangeFrom] = useState(1);
  const [pageRangeTo, setPageRangeTo] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [watermarkedPdf, setWatermarkedPdf] = useState<Uint8Array | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfUploadInputRef = useRef<HTMLInputElement>(null);

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

  /* ---------- Stamp compose options (shared by preview + export) ---------- */
  const composeOptions = useMemo<StampComposeOptions>(
    () =>
      stampComposeOptionsFromSettings({
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
        mosaicMode,
        behindContent,
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
      mosaicMode,
      behindContent,
    ],
  );

  /* ---------- PDF upload ---------- */
  const loadPdfFromFile = async (f: File) => {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) await loadPdfFromFile(f);
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

  /* ---------- Watermark processing ---------- */
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
      const srcBytes = new Uint8Array(buf);
      const donorPdf = await PDFDocument.load(srcBytes);
      const outPdf = await PDFDocument.create();
      const total = donorPdf.getPageCount();

      setProgress(20);

      const stampSet = new Set(Array.from(selectedPages).map((p) => p - 1));

      const pdfjsDoc = await pdfjs.getDocument({ data: buf.slice(0) }).promise;

      setProgress(35);

      for (let i = 0; i < total; i++) {
        if (!stampSet.has(i)) {
          const [copied] = await outPdf.copyPages(donorPdf, [i]);
          outPdf.addPage(copied);
          continue;
        }

        setProgress(35 + Math.round((i / Math.max(total, 1)) * 45));

        const { pdfWidth, pdfHeight, pngBytes } = await composeStampedPage(
          pdfjsDoc,
          i,
          composeOptions,
        );

        const embedded = await outPdf.embedPng(pngBytes);
        const page = outPdf.addPage([pdfWidth, pdfHeight]);
        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: pdfWidth,
          height: pdfHeight,
        });
      }

      pdfjsDoc.destroy();

      setProgress(90);
      const bytes = await outPdf.save();
      setWatermarkedPdf(bytes);
      setProgress(100);
      setTimeout(() => setCurrentStep("download"), 600);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Watermark failed. Try a smaller PDF.",
      );
      setCurrentStep("customize");
    }
  };

  const downloadFile = () => {
    if (!watermarkedPdf) return;
    const filename = file
      ? buildLexorbitProcessedFilename(file.name, "stamped")
      : "document_lexorbit_stamped.pdf";
    triggerBlobDownload(
      new Blob([new Uint8Array(watermarkedPdf)], { type: "application/pdf" }),
      filename,
    );
    toast.success("Downloaded!");
  };

  const reset = () => {
    setFile(null);
    setWatermarkedPdf(null);
    setCurrentStep("upload");
    setProgress(0);
    setWatermarkText(DEFAULT_STAMP_TEXT);
    setImageWatermark(null);
    setImageUrl(null);
    setMosaicMode(false);
    setBehindContent(false);
  };

  const resetAll = () => {
    reset();
    setCurrentStep("upload");
  };

  /* ---------- Render Steps ---------- */
  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <Upload className="h-12 w-8 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF to Stamp</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a PDF file from your device
                </p>
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
                  stampSettings={composeOptions}
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
              <p className="text-xs text-muted-foreground">{totalPages} pages</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => pdfUploadInputRef.current?.click()}
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
                    <Select
                      value={fontFamily}
                      onValueChange={(v) => setFontFamily(v as any)}
                    >
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
                      <p className="text-xs font-medium truncate">
                        {imageWatermark.name}</p>
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

        {/* NEW: Placement Options */}
        <Card className="shadow-sm">
          <CardContent className="p-3 space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <Grid3x3 className="h-3 w-3" /> Placement
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs">Mosaic (3x3 grid)</Label>
              </div>
              <Switch
              checked={mosaicMode}
                onCheckedChange={setMosaicMode}
           />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs">Behind content</Label>
              </div>
              <Switch
                checked={behindContent}
                onCheckedChange={setBehindContent}
              />
            </div>
            {behindContent ? (
              <p className="text-[11px] text-muted-foreground leading-snug">
                Softer watermark blended into the page — content stays readable on
                top. Use the opacity control to tune how strong it appears.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-snug">
                Bold stamp drawn on top of all content.
              </p>
            )}
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
                  disabled={mosaicMode}
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
                  disabled={mosaicMode}
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
          <h3 className="text-2xl font-bold">PDF stamp successfully!</h3>
          <p className="text-muted-foreground">
            Your PDF has been stamped
          </p>

          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xs">PDF</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium">
                  {file
                    ? buildLexorbitProcessedFilename(file.name, "stamped")
                    : "document_lexorbit_stamped.pdf"}
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
            <h1 className="text-3xl font-bold text-foreground">Stamp PDF</h1>
            <p className="text-muted-foreground">Add text or image watermarks in seconds.</p>
          </div>
        </div>

        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "customize" && renderCustomize()}
        {currentStep === "processing" && renderProcessing()}
        {currentStep === "download" && renderDownload()}
      </div>
    </div>
  );
};

export default StampPDF;
