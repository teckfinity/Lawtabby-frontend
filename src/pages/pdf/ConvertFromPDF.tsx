import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  Check,
  RefreshCw,
  Printer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  convertPdfToFormat,
  fetchConvertedFileBlob,
  type ConversionPipelineMeta,
} from "@/api/pdf/convert";
import { fetchOcrLanguages, type OcrLanguage, type OcrLanguageOption } from "@/api/pdf/ocr";
import {
  buildPdfToFormatDownloadName,
  triggerBlobDownload,
} from "@/utils/lexorbitFilename";
import { PdfLibraryPickButton } from "@/components/library/LibraryFileSourceButtons";

type ProcessStep = "upload" | "processing" | "download";

function formatUploadSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const ConvertFromPDF = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("");
  const [conversionMessage, setConversionMessage] = useState<string>("");
  const [wordPipeline, setWordPipeline] = useState<ConversionPipelineMeta | null>(null);
  const [pptPipeline, setPptPipeline] = useState<ConversionPipelineMeta | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<OcrLanguage>("eng");
  const [forceOcr, setForceOcr] = useState(false);
  const [languageOptions, setLanguageOptions] = useState<OcrLanguageOption[]>([
    { code: "eng", label: "English", installed: true },
  ]);

  useEffect(() => {
    fetchOcrLanguages()
      .then((res) => {
        if (res.data?.languages?.length) setLanguageOptions(res.data.languages);
      })
      .catch(() => undefined);
  }, []);

  const needsOcrOptions = selectedFormat === "docx" || selectedFormat === "pptx";

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("PDF file uploaded successfully");
    }
  };

  const convertFile = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }
    if (!selectedFormat) {
      toast.error("Please select a conversion format");
      return;
    }

    setCurrentStep("processing");
    setProgress(0);

    try {
      // Simulate fake progress bar
      let progressValue = 0;
      const progressInterval = setInterval(() => {
        progressValue += Math.random() * 10;
        if (progressValue >= 95) {
          progressValue = 95;
          clearInterval(progressInterval);
        }
        setProgress(progressValue);
      }, 300);

      const result = await convertPdfToFormat(file, mapFormat(selectedFormat), {
        ocrLanguage: needsOcrOptions ? ocrLanguage : undefined,
        forceOcr: needsOcrOptions ? forceOcr : undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);

      setConvertedFileUrl(result.downloadUrl);
      setDownloadFilename(
        result.downloadFilename ||
          buildPdfToFormatDownloadName(file.name, selectedFormat),
      );
      setConversionMessage(result.message || "Conversion completed!");
      setWordPipeline(result.wordPipeline ?? null);
      setPptPipeline(result.pptPipeline ?? null);
      toast.success(result.message || "Conversion completed!");
      setTimeout(() => setCurrentStep("download"), 700);
    } catch (error) {
      console.error("Error converting PDF:", error);
      const message =
        error instanceof Error ? error.message : "Conversion failed. Please try again.";
      toast.error(message, { duration: 10000 });
      setCurrentStep("upload");
    }
  };

  const mapFormat = (format: string) => {
    switch (format) {
      case "docx":
        return "word";
      case "xlsx":
        return "excel";
      case "pptx":
        return "powerpoint";
      case "jpg":
        return "jpeg";
      case "png":
        return "png";
      case "txt":
        return "text";
      default:
        return format;
    }
  };

const downloadFile = async () => {
  if (!convertedFileUrl || !file) {
    toast.info("No converted file available for download.");
    return;
  }

  try {
    const blob = await fetchConvertedFileBlob(convertedFileUrl);
    const name =
      downloadFilename || buildPdfToFormatDownloadName(file.name, selectedFormat);
    triggerBlobDownload(blob, name);
    toast.success("File downloaded successfully!");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Download failed. Please try again.";
    toast.error(message);
  }
};


  const printFile = () => {
    toast.success("Opening print dialog...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const resetProcess = () => {
    setFile(null);
    setSelectedFormat("");
    setConvertedFileUrl(null);
    setDownloadFilename("");
    setConversionMessage("");
    setWordPipeline(null);
    setPptPipeline(null);
    setCurrentStep("upload");
    setProgress(0);
  };

  const conversionOptions = [
    {
      format: "docx",
      name: "Word Document",
      icon: FileText,
      description: "Editable Word document with preserved formatting",
      color: "bg-navy/10 text-navy",
    },
    {
      format: "xlsx",
      name: "Excel Spreadsheet",
      icon: FileSpreadsheet,
      description: "Convert tables and data to Excel format",
      color: "bg-success/15 text-success",
    },
    {
      format: "pptx",
      name: "PowerPoint",
      icon: Presentation,
      description: "Convert to PowerPoint presentation",
      color: "bg-gold/15 text-gold-dark",
    },
    {
      format: "jpg",
      name: "JPG Images",
      icon: Image,
      description: "Convert each page to JPG image",
      color: "bg-legal-info/15 text-legal-info",
    },
    {
      format: "png",
      name: "PNG Images",
      icon: Image,
      description: "Convert each page to PNG image",
      color: "bg-primary/15 text-primary",
    },
    {
      format: "txt",
      name: "Plain Text",
      icon: FileText,
      description: "Extract text content only",
      color: "bg-muted text-muted-foreground",
    },
  ];

  const renderUploadStep = () => (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-8">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF to Convert</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a PDF file from your device
                  </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Select PDF File
                  </Button>
                  <PdfLibraryPickButton
                    onFileReady={(f) => {
                      setFile(f);
                      toast.success("PDF file uploaded successfully");
                    }}
                  />
                </div>
                <input
                 ref={fileInputRef} 
                 type="file"
                  accept=".pdf"
                  className="hidden" 
                  onChange={handleFileUpload}
                   />
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
                  {formatUploadSize(file.size)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {file && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Choose Conversion Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conversionOptions.map((option) => (
                <Card
                  key={option.format}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedFormat === option.format}
                  aria-label={`${option.name}. ${option.description}`}
                  className={`relative cursor-pointer rounded-lg border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    selectedFormat === option.format
                      ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/25"
                      : "border-transparent bg-card hover:border-primary/40 hover:bg-muted/30"
                  }`}
                  onClick={() => setSelectedFormat(option.format)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedFormat(option.format);
                    }
                  }}
                >
                  <CardContent className="p-4 pt-10">
                    {selectedFormat === option.format ? (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow">
                        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Selected
                      </span>
                    ) : null}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${option.color}`}
                      >
                        <option.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-medium">{option.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {needsOcrOptions && (
              <div className="mt-6 space-y-4 rounded-lg border p-4 text-left">
                <h4 className="font-medium">OCR options (scanned PDFs)</h4>
                <div className="space-y-2">
                  <label className="text-sm font-medium">OCR language</label>
                  <Select value={ocrLanguage} onValueChange={(v) => setOcrLanguage(v as OcrLanguage)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map(({ code, label, installed }) => (
                        <SelectItem key={code} value={code} disabled={!installed}>
                          {label}{!installed ? " (not installed)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="convert-force-ocr"
                    checked={forceOcr}
                    onCheckedChange={(v) => setForceOcr(v === true)}
                  />
                  <label htmlFor="convert-force-ocr" className="text-sm cursor-pointer">
                    Force OCR before conversion
                  </label>
                </div>
              </div>
            )}
            <div className="flex justify-center mt-6">
              <Button
               onClick={convertFile} 
               disabled={!selectedFormat} 
               className="bg-primary hover:bg-primary/90 px-8"
               >
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert
              </Button>
            </div>
          </CardContent>
        </Card>
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
                <RefreshCw className="h-10 w-10 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Converting to{" "}
                {conversionOptions.find((o) => o.format === selectedFormat)?.name ?? selectedFormat}…
              </h3>
              <p className="text-muted-foreground">
                {file?.name} ({formatUploadSize(file?.size ?? 0)})
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">CONVERTING</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDownloadStep = () => {
    const selectedOption = conversionOptions.find(
      (opt) => opt.format === selectedFormat
    );

    const outName =
      downloadFilename ||
      (file && selectedFormat ? buildPdfToFormatDownloadName(file.name, selectedFormat) : "Converted file");

    const pipeline = wordPipeline || pptPipeline;
    const pipelineEngine = pipeline?.chosen_engine || null;

    return (
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardContent className="p-12">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Conversion Complete!</h3>
                <p className="text-muted-foreground">
                  {conversionMessage || (
                    <>
                      Your PDF <span className="font-medium text-foreground">{file?.name}</span> has been
                      converted to {selectedOption?.name}.
                    </>
                  )}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-left">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${selectedOption?.color}`}
                  >
                    {selectedOption?.icon && <selectedOption.icon className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{outName}</h4>
                    <p className="text-sm text-muted-foreground truncate" title={`${file?.name ?? ""}`}>
                      Source PDF: {file?.name} · {formatUploadSize(file?.size ?? 0)}
                    </p>
                    {pipelineEngine && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Conversion engine: {pipelineEngine.replace(/_/g, " ")}
                        {pipeline?.ocr_prep_layer_applied ? " · OCR pre-processing applied" : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-green-600 font-medium text-sm shrink-0">✓ Done</div>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button 
                onClick={downloadFile} 
                className="bg-primary hover:bg-primary/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {selectedOption?.name}
                </Button>
                <Button onClick={printFile} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Document
                </Button>
                <Button variant="outline" onClick={resetProcess}>
                  Convert Another
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              currentStep === "upload"
               ? navigate("/pdf-tools") 
               : setCurrentStep("upload")
            }
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              PDF to other Formats
              </h1>
            <p className="text-muted-foreground">
              Easily convert your PDF files into DOC, PPT, EXCEL, JPG, PNG and
               DOCX documents.
            </p>
          </div>
        </div>
        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "download" && renderDownloadStep()}
      </div>
    </div>
  );
};

export default ConvertFromPDF;
