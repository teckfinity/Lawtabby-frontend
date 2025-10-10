import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, FileText, Image, FileSpreadsheet, Presentation, Check, RefreshCw, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { convertWordToPDF } from "@/api/api"; // ✅ Import your API function

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
        const formData = new FormData();
        formData.append("input_files", file, file.name);

        const response = await convertWordToPDF(file); // Call backend API
        toast.success(`${file.name} converted successfully`);

        // If your API returns a PDF blob directly
        const blob = new Blob([response.data], { type: "application/pdf" });
        convertedResults.push({ name: file.name.replace(/\.[^/.]+$/, ".pdf"), blob });

        setProgress((prev) => Math.min(prev + 100 / files.length, 100));
      }

      setConvertedFiles(convertedResults);
      setTimeout(() => setCurrentStep("download"), 800);
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert file(s)");
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
              <p className="text-muted-foreground">Your files have been converted to PDF successfully</p>
            </div>

            <div className="space-y-3">
              {convertedFiles.map((file, index) => (
                <div key={index} className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs">PDF</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">Ready to download</p>
                    </div>
                    <div className="text-green-600 font-medium text-sm">✓ Converted</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={downloadFiles} className="bg-primary hover:bg-primary/90">
                <Download className="h-4 w-4 mr-2" />
                Download All PDFs
              </Button>
              <Button onClick={printFiles} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print All PDFs
              </Button>
              <Button variant="outline" onClick={resetProcess}>
                Convert More
              </Button>
            </div>
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
