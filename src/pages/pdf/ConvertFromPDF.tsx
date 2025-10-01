import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, FileText, Image, FileSpreadsheet, Presentation, Check, RefreshCw, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type ProcessStep = "upload" | "processing" | "download";

const ConvertFromPDF = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("PDF file uploaded successfully");
    }
  };

  const convertFile = () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }
    if (!selectedFormat) {
      toast.error("Please select a conversion format");
      return;
    }
    
    setCurrentStep("processing");
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 12;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep("download");
        }, 500);
      }
      setProgress(currentProgress);
    }, 180);
  };

  const downloadFile = () => {
    toast.success("Download started!");
    setTimeout(() => {
      toast.success("Converted file downloaded successfully!");
    }, 1000);
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
    setCurrentStep("upload");
    setProgress(0);
  };

  const conversionOptions = [
    {
      format: "docx",
      name: "Word Document",
      icon: FileText,
      description: "Editable Word document with preserved formatting",
      color: "bg-blue-100 text-blue-600"
    },
    {
      format: "xlsx",
      name: "Excel Spreadsheet",
      icon: FileSpreadsheet,
      description: "Convert tables and data to Excel format",
      color: "bg-green-100 text-green-600"
    },
    {
      format: "pptx",
      name: "PowerPoint",
      icon: Presentation,
      description: "Convert to PowerPoint presentation",
      color: "bg-orange-100 text-orange-600"
    },
    {
      format: "jpeg",
      name: "JPEG Images",
      icon: Image,
      description: "Convert each page to JPEG image",
      color: "bg-purple-100 text-purple-600"
    },
    {
      format: "png",
      name: "PNG Images",
      icon: Image,
      description: "Convert each page to PNG image",
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      format: "txt",
      name: "Plain Text",
      icon: FileText,
      description: "Extract text content only",
      color: "bg-gray-100 text-gray-600"
    }
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
                <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select PDF File
                </Button>
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
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFile(null)}
              >
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
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedFormat === option.format 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedFormat(option.format)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${option.color}`}>
                        <option.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{option.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Button
                onClick={convertFile}
                disabled={!selectedFormat}
                className="bg-primary hover:bg-primary/90 px-8"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert & Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Conversion Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Supported Formats</h4>
              <ul className="space-y-1">
                <li>• Microsoft Word (DOCX)</li>
                <li>• Microsoft Excel (XLSX)</li>
                <li>• Microsoft PowerPoint (PPTX)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Image Formats</h4>
              <ul className="space-y-1">
                <li>• JPEG (High quality images)</li>
                <li>• PNG (Transparent backgrounds)</li>
                <li>• Plain Text (Text extraction)</li>
              </ul>
            </div>
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
              <h3 className="text-xl font-semibold mb-2">Converting to {selectedFormat.toUpperCase()}...</h3>
              <p className="text-muted-foreground">{file?.name} ({(file?.size / 1024 / 1024)?.toFixed(2)}mb)</p>
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
    const selectedOption = conversionOptions.find(opt => opt.format === selectedFormat);
    
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
                <p className="text-muted-foreground">Your PDF has been converted to {selectedOption?.name}</p>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${selectedOption?.color}`}>
                    {selectedOption?.icon && <selectedOption.icon className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium">
                      {file?.name?.replace('.pdf', `.${selectedFormat}`)}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {(file?.size / 1024 / 1024)?.toFixed(2)} MB
                    </p>
                  </div>
                  <div className="text-green-600 font-medium text-sm">✓ Converted</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={downloadFile} className="bg-primary hover:bg-primary/90">
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
            onClick={() => currentStep === "upload" ? navigate("/pdf-tools") : setCurrentStep("upload")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">PDF to other Formats</h1>
            <p className="text-muted-foreground">Easily convert your PDF files into DOC, PPT, EXCEL, JPEG, PPTX and DOCX documents.</p>
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