'use client';

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { convertOCRToPDF } from "@/api";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";

/* ------------------------------------------------------------------ */
/*  ONLY THESE LANGUAGES ARE SUPPORTED BY THE BACKEND                */
/* ------------------------------------------------------------------ */
const LANGUAGE_OPTIONS = [
  { code: "eng", label: "English" },
  { code: "spa", label: "Spanish" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
] as const;

type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

const OCRPDF = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("eng");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{
    pdfUrl: string;
    fileName: string;
  } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("File uploaded successfully");
    }
  };

  const performOCR = async () => {
    if (!file) {
      toast.error("Please upload a file first");
      return;
    }

    setIsProcessing(true);

    try {
      // ---- API call now passes language as second arg ----
      const response = await convertOCRToPDF(file, selectedLanguage);

      if (response?.data) {
        const { message, data, ocr_processing: ocrMeta } = response.data;
        const ocrFailed =
          ocrMeta?.ocr_layer_status === "returned_original_fallback";

        if (ocrFailed) {
          toast.warning(
            message ||
              "OCR engines could not process this file. Ensure the server has Tesseract/OCRmyPDF installed.",
            { duration: 8000 },
          );
        } else {
          toast.success(message || "OCR completed successfully!");
        }

        const pdfUrl = data?.pdf || "";
        if (!pdfUrl) {
          toast.error("No download URL returned from server.");
          return;
        }

        const fileName = `ocr_${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
        setDownloadInfo({ pdfUrl, fileName });
      } else {
        toast.error("Failed to process OCR. Please try again.");
      }
    } catch (error: unknown) {
      console.error("OCR API Error:", error);
      const err = error as { response?: { data?: { error?: string; detail?: string } } };
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "OCR processing failed.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadInfo?.pdfUrl) return;

    try {
      const resp = await fetch(downloadInfo.pdfUrl, { method: "GET" });
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadInfo.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF.");
    }
  };

  const resetAll = () => {
    setFile(null);
    setDownloadInfo(null);
    setSelectedLanguage("eng");
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
              Easily convert scanned PDF and images into searchable and selectable documents.
            </p>
          </div>
        </div>

        {/* DOWNLOAD SCREEN – Shows FILENAME, not URL */}
        {downloadInfo ? (
          <div className="w-full max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center space-y-6">
                <h3 className="text-2xl font-bold">OCR completed successfully!</h3>
                <p className="text-muted-foreground">
                  Your document is now searchable and editable.
                </p>

                <div className="bg-muted rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-xs">PDF</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium">{downloadInfo.fileName}</h4>
                      <p className="text-sm text-muted-foreground">ready to download</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={resetAll}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button onClick={handleDownload} className="px-10">
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="icon" onClick={resetAll}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                <div className="mt-10">
                  <PDFToolRecommendations currentTool="ocr" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Upload + Settings UI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column (Upload + Settings) */}
              <div className="space-y-6">
                {/* File Upload */}
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
                          <Button
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Select File
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                          <div className="w-12 h-12 bg-teal-100 rounded flex items-center justify-center">
                            <span className="text-teal-600 font-bold text-xs">
                              {file.name.split(".").pop()?.toUpperCase()}
                            </span>
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
                      </div>
                    )}
                  </CardContent>
                </Card>

                {file && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">OCR Settings</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Document Language</label>
                          <Select
                            value={selectedLanguage}
                            onValueChange={(v) => setSelectedLanguage(v as LanguageCode)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGE_OPTIONS.map(({ code, label }) => (
                                <SelectItem key={code} value={code}>
                                  <div className="flex items-center gap-2">
                                    <Languages className="h-4 w-4" />
                                    {label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={performOCR}
                          disabled={isProcessing}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <ScanText className="h-4 w-4 mr-2" />
                          {isProcessing ? "Processing OCR..." : "Process OCR"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Processing spinner */}
                {isProcessing && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <div>
                          <h4 className="font-medium text-blue-800">Processing Document</h4>
                          <p className="text-sm text-blue-600">
                            Analyzing document structure and extracting text...
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* ---- RIGHT COLUMN (Info) ---- */}
              <div className="space-y-6">
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3">How OCR Works</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• <strong>Upload:</strong> Select your PDF or image file</li>
                      <li>• <strong>Language:</strong> Choose document language for best results</li>
                      <li>• <strong>Process:</strong> AI analyzes and recognizes text</li>
                      <li>• <strong>Download:</strong> Get your searchable PDF</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3">OCR Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• <strong>High Accuracy:</strong> Advanced OCR engine with 99%+ accuracy</li>
                      <li>• <strong>Multi-language:</strong> Support for English, Spanish, French, German</li>
                      <li>• <strong>Searchable PDF:</strong> Create searchable and selectable PDFs</li>
                      <li>• <strong>Format Preservation:</strong> Maintains document structure</li>
                      <li>• <strong>Image Support:</strong> Process scanned images and photos</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OCRPDF;