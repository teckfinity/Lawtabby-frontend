'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  convertOCRToPDF,
  fetchOcrLanguages,
  fetchOcrPdfBlob,
  type OcrLanguage,
  type OcrLanguageOption,
} from "@/api/pdf/ocr";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
};

const HOW_OCR_WORKS = [
  { title: "Upload", text: "Select your PDF or image file" },
  { title: "Language", text: "Choose document language for best results" },
  { title: "Process", text: "AI analyzes and recognizes text" },
  { title: "Download", text: "Get your searchable PDF" },
];

const OCR_FEATURES = [
  { title: "High Accuracy", text: "Advanced OCR engine with 99%+ accuracy" },
  { title: "Multi-language", text: "Support for English, Spanish, French, German" },
  { title: "Searchable PDF", text: "Create searchable and selectable PDFs" },
  { title: "Format Preservation", text: "Maintains document structure" },
  { title: "Image Support", text: "Process scanned images and photos" },
];

const OCRPDF = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<OcrLanguage>("eng");
  const [languageOptions, setLanguageOptions] = useState<OcrLanguageOption[]>(
    DEFAULT_LANGUAGE_OPTIONS,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [previewWidth, setPreviewWidth] = useState(480);
  const [pdfNumPages, setPdfNumPages] = useState(0);

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

    try {
      const response = await convertOCRToPDF(file, selectedLanguage);
      const payload = response.data;

      if (!payload?.data?.pdf) {
        toast.error(payload?.error || "Failed to process OCR.");
        return;
      }

      const ocrMeta = payload.ocr_processing;
      const ocrSuccess =
        ocrMeta?.ocr_layer_status === "layer_applied_or_rebuilt";

      const blob = await fetchOcrPdfBlob(payload.data.pdf);
      const pdfBlobUrl = URL.createObjectURL(blob);
      const fileName = `ocr_${file.name.replace(/\.[^/.]+$/, "")}.pdf`;

      setResult({
        fileName,
        pdfUrl: payload.data.pdf,
        pdfBlobUrl,
        pageCount: payload.total_pages_processed || 0,
        ocrSuccess,
        engine: ocrMeta?.ocr_primary_engine,
      });
      setPdfNumPages(0);

      if (ocrSuccess) {
        toast.success("Your document is now searchable and editable.");
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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download PDF.");
    }
  }, [result]);

  const resetAll = () => {
    if (result?.pdfBlobUrl) URL.revokeObjectURL(result.pdfBlobUrl);
    setFile(null);
    setResult(null);
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
              Convert scanned PDFs and images into searchable, selectable documents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: upload + settings (always visible) */}
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
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Select File
                      </Button>
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
                    {languageOptions.some((lang) => !lang.installed) && (
                      <p className="text-xs text-muted-foreground">
                        Only languages installed on the server can be used. On macOS install
                        missing packs with{" "}
                        <code className="text-xs">brew install tesseract-lang</code>.
                      </p>
                    )}
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
              <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        OCR completed
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                        Your document is now searchable and editable.
                      </p>
                      {result.engine && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Engine: {result.engine.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleDownload} className="flex-1 min-w-[140px]">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline" onClick={resetAll}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: info cards OR preview cards */}
          <div className="space-y-6">
            {result ? (
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
                    className="max-h-[720px] overflow-y-auto bg-muted/30 p-3 space-y-4"
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
