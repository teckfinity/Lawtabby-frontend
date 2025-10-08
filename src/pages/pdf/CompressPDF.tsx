import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, Check, Zap, Printer, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";
import { compressPDF as compressPDFApi } from "@/api/api"; // import your API function

type ProcessStep = "upload" | "processing" | "download";

const CompressPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [compressedFileUrl, setCompressedFileUrl] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("PDF file uploaded successfully");
    }
    event.target.value = '';
  };

  const compressPDF = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }

    setCurrentStep("processing");
    setProgress(0);

    // Optional: fake progress animation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 80) {
        currentProgress = 80; // leave some progress for API call
        clearInterval(interval);
      }
      setProgress(currentProgress);
    }, 150);

    try {
      // Map compressionLevel to quality number (example: low=80, medium=60, high=40)
      const qualityMap: Record<string, number> = { low: 80, medium: 60, high: 40 };
      const response = await compressPDFApi(file, qualityMap[compressionLevel]);

      // Use split_pdf.compressed_file instead of file_url
      if (response.data && response.data.split_pdf?.compressed_file) {
        setCompressedFileUrl(response.data.split_pdf.compressed_file);
        setProgress(100);
        setTimeout(() => setCurrentStep("download"), 500);
        toast.success("PDF compressed successfully!");
      } else {
        throw new Error("No file URL returned from server");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to compress PDF");
      setCurrentStep("upload");
      setProgress(0);
    }
  };

  const downloadFile = async () => {
    if (!compressedFileUrl) return;

    toast.success("Download started!");

    try {
      // fetch the file as blob
      const res = await fetch(compressedFileUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed_${file?.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Compressed file downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download file");
    }
  };

  const resetProcess = () => {
    setFile(null);
    setCurrentStep("upload");
    setProgress(0);
    setCompressedFileUrl(null);
    };

  const getCompressionInfo = () => {
    const originalSize = file ? file.size / 1024 / 1024 : 0;
    const compressionRates = { low: 0.8, medium: 0.6, high: 0.4 };
    const compressedSize = originalSize * compressionRates[compressionLevel as keyof typeof compressionRates];
    const savings = Math.round((1 - compressionRates[compressionLevel as keyof typeof compressionRates]) * 100);
    
    return { originalSize, compressedSize, savings };
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF to Compress</h3>
                <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
                <Button 
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select PDF File
                </Button>
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

      {file && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Compression Settings</h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="compression"
                      value="low"
                      checked={compressionLevel === "low"}
                      onChange={(e) => setCompressionLevel(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium">Low Compression</span>
                      <p className="text-sm text-muted-foreground">Better quality, larger file size</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">~20% savings</span>
                </label>
                
                <label className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="compression"
                      value="medium"
                      checked={compressionLevel === "medium"}
                      onChange={(e) => setCompressionLevel(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium">Medium Compression</span>
                      <p className="text-sm text-muted-foreground">Balanced quality and size</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">~40% savings</span>
                </label>
                
                <label className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="compression"
                      value="high"
                      checked={compressionLevel === "high"}
                      onChange={(e) => setCompressionLevel(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium">High Compression</span>
                      <p className="text-sm text-muted-foreground">Smaller file size, reduced quality</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">~60% savings</span>
                </label>
              </div>
              
              <Button onClick={compressPDF} className="w-full bg-primary hover:bg-primary/90">
                <Zap className="h-4 w-4 mr-2" />
                Compress PDF
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
                <Zap className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Compressing PDF...</h3>
              <p className="text-muted-foreground">{file?.name} ({(file?.size / 1024 / 1024)?.toFixed(2)}mb)</p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">COMPRESSING</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDownloadStep = () => {
    const { originalSize, compressedSize, savings } = getCompressionInfo();
    
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-primary">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Compression Complete!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your PDF has been compressed successfully. Download or continue with other tools.
            </p>

            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                  <span className="text-red-600 font-bold text-xs">PDF</span>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium">compressed_{file?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {compressedSize.toFixed(2)} MB (was {originalSize.toFixed(2)} MB)
                  </p>
                </div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded text-green-700 font-medium">
                {savings}% file size reduction
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={resetProcess}
                className="h-12 w-12"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <Button
                onClick={downloadFile}
                className="bg-primary hover:bg-primary/90 h-12 px-8"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Compressed PDF
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={resetProcess}
                className="h-12 w-12 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>

            <PDFToolRecommendations currentTool="compress" />
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
            <h1 className="text-3xl font-bold text-foreground">Compress PDF</h1>
            <p className="text-muted-foreground">Reduce PDF file size while maintaining quality.</p>
          </div>
        </div>

        {/* Hidden file input that's always available */}
        <input
          id="pdf-upload"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileUpload}
        />

        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "download" && renderDownloadStep()}
      </div>
    </div>
  );
};

export default CompressPDF;