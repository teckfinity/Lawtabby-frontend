import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, FileText, Image, FileSpreadsheet, Presentation, RefreshCw, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { convertWordToPDF } from "@/api";
import axios from "axios";
import { PDFToolDownloadResult } from "@/components/pdf/PDFToolDownloadResult";
import {
  buildLexorbitConvertedFilename,
  triggerBlobDownload,
} from "@/utils/lexorbitFilename";

function summarizeUploadedNames(names: string[], maxChars = 100): string {
  const joined = names.join(", ");
  if (joined.length <= maxChars) return joined;
  return `${joined.slice(0, maxChars - 3)}…`;
}

type ProcessStep = "upload" | "processing" | "download";

const ConvertToPDF = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<{ name: string; blob: Blob }[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles([...files, ...selectedFiles]);
    toast.success(`Added ${selectedFiles.length} file(s) for conversion`);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    toast.success("File removed");
  };

  // ✅ Main conversion logic
  const convertToPDF = async () => {
    if (files.length === 0) {
      toast.error("Please upload files to convert");
      return;
    }

    setCurrentStep("processing");
    setProgress(0);

    try {
      const convertedResults: { name: string; blob: Blob }[] = [];

      for (const file of files) {
        const { blob, docxConversionEngine, conversionEngine, conversionWarning } =
          await convertWordToPDF(file);

        const headerBuf = await blob.slice(0, 5).arrayBuffer();
        const magic = new TextDecoder().decode(headerBuf);
        if (!magic.startsWith("%PDF")) {
          const asText = await blob.slice(0, 300).text();
          throw new Error(
            `Server did not return a PDF for "${file.name}". ${asText.slice(0, 120)}`.trim(),
          );
        }

        if (docxConversionEngine === "reportlab_fallback" || conversionEngine === "reportlab_fallback") {
          toast.warning(`${file.name} converted (limited quality)`, {
            description:
              conversionWarning ||
              "Server used a text-only fallback — images and slide layout are not preserved. Redeploy the API with LibreOffice (impress/calc) and Cloud Run memory ≥ 2Gi.",
            duration: 10000,
          });
        } else {
          toast.success(`${file.name} converted successfully`);
        }
        convertedResults.push({
          name: buildLexorbitConvertedFilename(file.name, "pdf"),
          blob,
        });

        setProgress((prev) => Math.min(prev + 100 / files.length, 100));
      }

      setConvertedFiles(convertedResults);
      setTimeout(() => setCurrentStep("download"), 800);
    } catch (error) {
      console.error("Conversion error:", error);
      let message = "Failed to convert file(s).";
      if (axios.isAxiosError(error)) {
        const d = error.response?.data;
        if (d && typeof d === "object" && "error" in d) {
          message = String((d as { error: string }).error);
        } else if (error.message) message = error.message;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      toast.error(message);
      setCurrentStep("upload");
    }
  };

  // ✅ Download all converted PDFs
  const downloadFiles = () => {
    if (convertedFiles.length === 0) {
      toast.error("No converted files to download");
      return;
    }

    convertedFiles.forEach((file) => {
      const url = window.URL.createObjectURL(file.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });

    toast.success("Converted files downloaded successfully!");
  };

  const printFiles = () => {
    toast.success("Opening print dialog...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const resetProcess = () => {
    setFiles([]);
    setConvertedFiles([]);
    setCurrentStep("upload");
    setProgress(0);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "doc":
      case "docx":
        return { icon: FileText, color: "bg-blue-100 text-blue-600" };
      case "xls":
      case "xlsx":
        return { icon: FileSpreadsheet, color: "bg-green-100 text-green-600" };
      case "ppt":
      case "pptx":
        return { icon: Presentation, color: "bg-orange-100 text-orange-600" };
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return { icon: Image, color: "bg-purple-100 text-purple-600" };
      default:
        return { icon: FileText, color: "bg-gray-100 text-gray-600" };
    }
  };

  const supportedFormats = [
    {
      category: "Documents",
      formats: ["DOC", "DOCX", "TXT", "RTF"],
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
    },
    {
      category: "Spreadsheets",
      formats: ["XLS", "XLSX", "CSV"],
      icon: FileSpreadsheet,
      color: "bg-green-100 text-green-600",
    },
    {
      category: "Presentations",
      formats: ["PPT", "PPTX"],
      icon: Presentation,
      color: "bg-orange-100 text-orange-600",
    },
    {
      category: "Images",
      formats: ["JPG", "JPEG", "PNG", "GIF", "BMP"],
      icon: Image,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  // ---------------- RENDER UI ----------------

  const renderUploadStep = () => (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Files to Convert</h3>
              <p className="text-muted-foreground mb-4">Choose files from your device to convert to PDF</p>
              <Button
                type="button"
                className="bg-primary hover:bg-primary/90"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.rtf,.csv,.bmp"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Files to Convert ({files.length})</h3>

            <div className="space-y-3">
              {files.map((file, index) => {
                const fileIcon = getFileIcon(file.name);
                return (
                  <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${fileIcon.color}`}>
                      <fileIcon.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeFile(index)}>
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={convertToPDF} className="bg-primary hover:bg-primary/90 px-8">
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert to PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Supported File Formats</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportedFormats.map((category) => (
              <div key={category.category} className="text-center">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${category.color}`}>
                  <category.icon className="h-6 w-6" />
                </div>
                <h4 className="font-medium mb-2">{category.category}</h4>
                <div className="text-sm text-muted-foreground">
                  {category.formats.map((format, index) => (
                    <span key={format}>
                      {format}
                      {index < category.formats.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
              <h3 className="text-xl font-semibold mb-2">Converting Files...</h3>
              <p className="text-muted-foreground">Converting {files.length} file(s) to PDF format</p>
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

  const renderDownloadStep = () => (
    <PDFToolDownloadResult
      title="Conversion complete!"
      description="Download your new PDF files. Names match your originals with a .pdf extension."
      outputFilename={
        convertedFiles.length === 1
          ? convertedFiles[0].name
          : `${convertedFiles.length} PDF documents`
      }
      sourceSummary={
        files.length ? `Uploaded: ${summarizeUploadedNames(files.map((f) => f.name))}` : undefined
      }
      downloadButtonLabel={convertedFiles.length > 1 ? "Download all PDFs" : "Download PDF"}
      onDownload={downloadFiles}
      onReset={resetProcess}
      currentTool="convert"
      children={
        convertedFiles.length > 1 ? (
          <ul className="mt-3 space-y-2 border-t border-border pt-3 text-sm text-muted-foreground">
            {convertedFiles.map((f) => (
              <li key={f.name} className="truncate" title={f.name}>
                {f.name}
              </li>
            ))}
          </ul>
        ) : null
      }
      belowActions={
        <>
          <Button type="button" variant="outline" size="sm" onClick={printFiles}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetProcess}>
            Convert more files
          </Button>
        </>
      }
    />
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (currentStep === "upload" ? navigate("/pdf-tools") : setCurrentStep("upload"))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Other formats to PDF</h1>
            <p className="text-muted-foreground">Turn your DOC, PPT, EXCEL, JPEG, PPTX and DOCX documents into PDF file.</p>
          </div>
        </div>

        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "download" && renderDownloadStep()}
      </div>
    </div>
  );
};

export default ConvertToPDF;
