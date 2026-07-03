'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  ScanText,
  Languages,
  Download,
  Trash2,
  CheckCircle2,
  Eye,
  Copy,
  AlertTriangle,
  BarChart3,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Document, Page } from "react-pdf";
import "@/lib/pdfjsWorker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  convertOCRToPDF,
  fetchOcrLanguages,
  fetchOcrPdfBlob,
  qualityBadgeClass,
  type OcrLanguage,
  type OcrLanguageOption,
  type OcrQualityMetrics,
  type StructuredTextPage,
} from "@/api/pdf/ocr";
import { buildLexorbitProcessedFilename, triggerBlobDownload } from "@/utils/lexorbitFilename";
import { PdfLibraryPickButton } from "@/components/library/LibraryFileSourceButtons";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";

const DEFAULT_LANGUAGE_OPTIONS: OcrLanguageOption[] = [
  { code: "eng", label: "English", installed: true },
  { code: "spa", label: "Spanish", installed: false },
  { code: "fra", label: "French", installed: false },
  { code: "deu", label: "German", installed: false },
];

type OcrResult = {
  fileName: string;
  pdfUrl: string;
  pdfBlobUrl: string;
  pageCount: number;
  ocrSuccess: boolean;
  engine?: string | null;
  extractedText: string;
  structuredPages: StructuredTextPage[];
  ocrQuality: OcrQualityMetrics | null;
  processingSeconds?: number;
  warnings: string[];
};

const HOW_OCR_WORKS = [
  { title: "Upload", text: "Select your PDF or image file" },
  { title: "Language", text: "Choose document language for best results" },
  { title: "Process", text: "AI analyzes and recognizes text" },
  { title: "Review", text: "Check quality metrics and extracted text" },
  { title: "Download", text: "Get your searchable PDF" },
];

const OCR_FEATURES = [
  { title: "Quality Metrics", text: "Per-page confidence scores and quality labels" },
  { title: "Multi-language", text: "Support for English, Spanish, French, German" },
  { title: "Searchable PDF", text: "Create searchable and selectable PDFs" },
  { title: "Layout Preservation", text: "Headings, paragraphs, and lists preserved" },
  { title: "Copy & Preview", text: "Review and copy extracted text before download" },
];

function StructuredTextPreview({ pages }: { pages: StructuredTextPage[] }) {
  if (!pages.length) {
    return (
      <p className="text-sm text-muted-foreground italic p-4">
        No structured text could be extracted from this document.
      </p>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {pages.map((page) => (
        <div key={page.page} className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">
            Page {page.page}
          </div>
          {page.blocks.map((block, idx) => {
            if (block.type === "heading") {
              return (
                <p key={idx} className="font-semibold text-base text-foreground">
                  {block.text}
                </p>
              );
            }
            if (block.type === "list") {
              return (
                <p key={idx} className="text-sm pl-4 text-foreground whitespace-pre-line">
                  {block.text}
                </p>
              );
            }
            if (block.type === "table") {
              return (
                <pre key={idx} className="text-xs bg-muted/40 rounded p-2 whitespace-pre-wrap font-mono">
                  {block.text}
                </pre>
              );
            }
            return (
              <p key={idx} className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {block.text}
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function OcrQualityPanel({ quality }: { quality: OcrQualityMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          OCR Quality Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">OCR Confidence</p>
            <p className="text-2xl font-bold">{quality.average_confidence}%</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">OCR Quality</p>
            <Badge className={`mt-1 ${qualityBadgeClass(quality.quality_label)}`}>
              {quality.quality_label}
            </Badge>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 col-span-2">
            <p className="text-xs text-muted-foreground">Pages Processed</p>
            <p className="text-lg font-semibold">{quality.pages_processed}</p>
          </div>
        </div>

        {quality.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 space-y-1">
            {quality.warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {w}
              </p>
            ))}
          </div>
        )}

        {quality.pages.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Per-page confidence</p>
            <div className="max-h-40 overflow-y-auto rounded border divide-y text-sm">
              {quality.pages.map((p) => (
                <div
                  key={p.page}
                  className={`flex items-center justify-between px-3 py-2 ${
                    p.low_confidence ? "bg-amber-50/80 dark:bg-amber-950/20" : ""
                  }`}
                >
                  <span>Page {p.page}</span>
                  <span className="flex items-center gap-2">
                    {p.low_confidence && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-label="Low confidence" />
                    )}
                    <span className="font-medium">{p.confidence}%</span>
                    <Badge variant="outline" className="text-xs">
                      {p.quality}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const OCRPDF = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<OcrLanguage>("eng");
  const [forceOcr, setForceOcr] = useState(false);
  const [languageOptions, setLanguageOptions] = useState<OcrLanguageOption[]>(
    DEFAULT_LANGUAGE_OPTIONS,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [previewWidth, setPreviewWidth] = useState(480);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOcrLanguages()
      .then((res) => {
        if (cancelled || !res.data?.languages?.length) return;
        setLanguageOptions(res.data.languages);
        const installed = res.data.languages.filter((lang) => lang.installed);
        if (installed.length && !installed.some((lang) => lang.code === selectedLanguage)) {
          setSelectedLanguage(installed[0].code);
        }
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!previewContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setPreviewWidth(Math.min(w - 24, 560));
    });
    ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, [result]);

  useEffect(() => {
    return () => {
      if (result?.pdfBlobUrl) URL.revokeObjectURL(result.pdfBlobUrl);
    };
  }, [result?.pdfBlobUrl]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setCopySuccess(false);
      toast.success("File uploaded successfully");
    }
  };

  const performOCR = async () => {
    if (!file) {
      toast.error("Please upload a file first");
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setCopySuccess(false);

    try {
      const response = await convertOCRToPDF(file, selectedLanguage, { forceOcr });
      const payload = response.data;

      if (!payload?.data?.pdf) {
        toast.error(payload?.error || "Failed to process OCR.");
        return;
      }

      const ocrMeta = payload.ocr_processing;
      const ocrQuality = payload.ocr_quality ?? ocrMeta?.ocr_quality ?? null;
      const ocrSuccess =
        ocrMeta?.ocr_layer_status === "layer_applied_or_rebuilt";

      const blob = await fetchOcrPdfBlob(payload.data.pdf);
      const pdfBlobUrl = URL.createObjectURL(blob);
      const fileName = buildLexorbitProcessedFilename(file.name, "ocr");

      const extractedText =
        payload.extracted_text ||
        ocrMeta?.structured_text ||
        payload.extracted_text_preview ||
        "";

      const structuredPages =
        payload.structured_pages || ocrMeta?.structured_pages || [];

      const warnings = [
        ...(ocrQuality?.warnings ?? []),
        ...(ocrSuccess
          ? []
          : [
              payload.message ||
                "OCR engines could not fully process this file.",
            ]),
      ];

      setResult({
        fileName,
        pdfUrl: payload.data.pdf,
        pdfBlobUrl,
        pageCount: payload.total_pages_processed || ocrQuality?.pages_processed || 0,
        ocrSuccess,
        engine: ocrMeta?.ocr_primary_engine,
        extractedText,
        structuredPages,
        ocrQuality,
        processingSeconds: ocrMeta?.processing_time_seconds,
        warnings,
      });
      setPdfNumPages(0);

      if (ocrSuccess) {
        toast.success("OCR completed. Review quality metrics and extracted text below.");
      } else {
        toast.warning(
          payload.message ||
            "OCR engines could not fully process this file. Preview may show limited text.",
          { duration: 8000 },
        );
      }
    } catch (error: unknown) {
      console.error("OCR API Error:", error);
      const err = error as {
        response?: { data?: { error?: string; detail?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "OCR processing failed.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!result) return;
    try {
      const blob = await fetchOcrPdfBlob(result.pdfUrl);
      triggerBlobDownload(blob, result.fileName);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download PDF.");
    }
  }, [result]);

  const handleCopyText = useCallback(async () => {
    if (!result?.extractedText) {
      toast.error("No extracted text to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(result.extractedText);
      setCopySuccess(true);
      toast.success("Text copied successfully.");
      setTimeout(() => setCopySuccess(false), 3000);
    } catch {
      toast.error("Failed to copy text. Try selecting text manually.");
    }
  }, [result]);

  const resetAll = () => {
    if (result?.pdfBlobUrl) URL.revokeObjectURL(result.pdfBlobUrl);
    setFile(null);
    setResult(null);
    setCopySuccess(false);
    setSelectedLanguage("eng");
  };

  const pdfFile = useMemo(
    () => (result?.pdfBlobUrl ? { url: result.pdfBlobUrl } : null),
    [result?.pdfBlobUrl],
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
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">OCR</h1>
            <p className="text-muted-foreground">
              Convert scanned PDFs and images into searchable, selectable documents with quality metrics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                {!file ? (
                  <div className="text-center">
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                      <ScanText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Upload File for OCR</h3>
                      <p className="text-muted-foreground mb-4">
                        Choose a PDF or image file from your device
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Select File
                        </Button>
                        <PdfLibraryPickButton
                          onFileReady={(f) => {
                            setFile(f);
                            setResult(null);
                            toast.success("File uploaded successfully");
                          }}
                        />
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="w-12 h-12 bg-teal-100 rounded flex items-center justify-center">
                      <span className="text-teal-600 font-bold text-xs">
                        {file.name.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setFile(null); setResult(null); }}>
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {file && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold">OCR Settings</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Document Language</label>
                    <Select
                      value={selectedLanguage}
                      onValueChange={(v) => setSelectedLanguage(v as OcrLanguage)}
                      disabled={isProcessing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map(({ code, label, installed }) => (
                          <SelectItem key={code} value={code} disabled={!installed}>
                            <div className="flex items-center gap-2">
                              <Languages className="h-4 w-4" />
                              {label}
                              {!installed ? " (not installed on server)" : ""}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox
                      id="force-ocr"
                      checked={forceOcr}
                      onCheckedChange={(v) => setForceOcr(v === true)}
                      disabled={isProcessing}
                    />
                    <label htmlFor="force-ocr" className="text-sm leading-snug cursor-pointer">
                      <span className="font-medium">Force OCR</span>
                      <span className="block text-muted-foreground text-xs mt-0.5">
                        Re-run OCR even when the PDF already has a text layer.
                      </span>
                    </label>
                  </div>
                  <Button
                    onClick={performOCR}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <ScanText className="h-4 w-4 mr-2" />
                    {isProcessing ? "Processing OCR..." : "Process OCR"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {isProcessing && (
              <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">
                        Processing Document
                      </h4>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        Analyzing structure, deskewing pages, and recognizing text…
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                {result.ocrQuality && <OcrQualityPanel quality={result.ocrQuality} />}

                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                          OCR completed
                        </h3>
                        <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                          {result.ocrSuccess
                            ? "Your document is now searchable and editable."
                            : "Processing finished with limited OCR coverage."}
                        </p>
                        {result.engine && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Engine: {result.engine.replace(/_/g, " ")}
                            {result.processingSeconds != null &&
                              ` · ${result.processingSeconds.toFixed(1)}s`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleDownload} className="flex-1 min-w-[140px]">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCopyText}
                        disabled={!result.extractedText}
                        className="flex-1 min-w-[140px]"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copySuccess ? "Copied!" : "Copy Text"}
                      </Button>
                      <Button variant="outline" onClick={resetAll}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Start Over
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      OCR Result Preview
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Review extracted text and layout before downloading the searchable PDF.
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[360px] overflow-y-auto bg-muted/20 border-t">
                      <StructuredTextPreview pages={result.structuredPages} />
                      {!result.structuredPages.length && result.extractedText && (
                        <pre className="p-4 text-sm whitespace-pre-wrap font-sans text-foreground">
                          {result.extractedText}
                        </pre>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Searchable PDF Preview
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Select and copy text directly from the preview below.
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div
                      ref={previewContainerRef}
                      className="max-h-[480px] overflow-y-auto bg-muted/30 p-3 space-y-4"
                    >
                      {pdfFile ? (
                        <Document
                          file={pdfFile}
                          loading={<p className="p-4 text-sm text-muted-foreground">Loading preview…</p>}
                          onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                        >
                          {Array.from(
                            { length: pdfNumPages || result.pageCount || 1 },
                            (_, i) => (
                            <div key={i} className="mb-4 shadow-sm bg-white rounded overflow-hidden">
                              <Page
                                pageNumber={i + 1}
                                width={previewWidth}
                                renderTextLayer
                                renderAnnotationLayer={false}
                              />
                            </div>
                          ))}
                        </Document>
                      ) : (
                        <p className="p-4 text-sm text-muted-foreground">Preview unavailable.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3">How OCR Works</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {HOW_OCR_WORKS.map(({ title, text }) => (
                        <li key={title}>
                          • <strong>{title}:</strong> {text}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3">OCR Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {OCR_FEATURES.map(({ title, text }) => (
                        <li key={title}>
                          • <strong>{title}:</strong> {text}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {result && (
          <div className="mt-10">
            <PDFToolRecommendations currentTool="ocr" />
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRPDF;
