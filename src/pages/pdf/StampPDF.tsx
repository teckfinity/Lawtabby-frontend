import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, Check, Stamp, Type, Image as ImageIcon, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type ProcessStep = "upload" | "processing" | "download";

const StampPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [stampType, setStampType] = useState<string>("text");
  const [stampText, setStampText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(50);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("PDF file uploaded successfully");
    }
  };

  const addStamp = () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }
    
    setCurrentStep("processing");
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 16;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep("download");
        }, 500);
      }
      setProgress(currentProgress);
    }, 170);
  };

  const downloadFile = () => {
    toast.success("Download started!");
    setTimeout(() => {
      toast.success("Stamped PDF downloaded successfully!");
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
    setCurrentStep("upload");
    setProgress(0);
  };

  const predefinedStamps = [
    "CONFIDENTIAL", "DRAFT", "APPROVED", "REJECTED", 
    "URGENT", "COPY", "ORIGINAL", "REVIEWED"
  ];

  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF to Stamp</h3>
                <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
                <label htmlFor="pdf-upload">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Upload className="h-4 w-4 mr-2" />
                    Select PDF File
                  </Button>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
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
            <h3 className="text-lg font-semibold mb-4">Stamp Settings</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={stampType === "text" ? "default" : "outline"}
                  onClick={() => setStampType("text")}
                  className="flex-1"
                >
                  <Type className="h-4 w-4 mr-2" />
                  Text Stamp
                </Button>
                <Button
                  variant={stampType === "image" ? "default" : "outline"}
                  onClick={() => setStampType("image")}
                  className="flex-1"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image Stamp
                </Button>
              </div>

              {stampType === "text" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stamp Text</label>
                    <input
                      type="text"
                      value={stampText}
                      onChange={(e) => setStampText(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Enter stamp text"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quick Stamps</label>
                    <div className="grid grid-cols-2 gap-2">
                      {predefinedStamps.map((stamp) => (
                        <Button
                          key={stamp}
                          variant="outline"
                          size="sm"
                          onClick={() => setStampText(stamp)}
                          className="text-xs"
                        >
                          {stamp}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Opacity: {opacity}%</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {stampType === "image" && (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Upload an image for your stamp</p>
                  <label htmlFor="stamp-upload">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                    <input
                      id="stamp-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              
              <Button onClick={addStamp} className="w-full bg-primary hover:bg-primary/90">
                <Stamp className="h-4 w-4 mr-2" />
                Apply Stamp
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
                <Stamp className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Adding Stamp...</h3>
              <p className="text-muted-foreground">{file?.name} ({(file?.size / 1024 / 1024)?.toFixed(2)}mb)</p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">STAMPING</div>
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
              <h3 className="text-xl font-semibold mb-2">Stamp Applied!</h3>
              <p className="text-muted-foreground">Your PDF has been stamped successfully</p>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                  <span className="text-red-600 font-bold text-xs">PDF</span>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium">stamped_{file?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {(file?.size / 1024 / 1024)?.toFixed(2)} MB
                  </p>
                </div>
                <div className="text-green-600 font-medium text-sm">✓ Stamped</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={downloadFile} className="bg-primary hover:bg-primary/90">
                <Download className="h-4 w-4 mr-2" />
                Download Stamped PDF
              </Button>
              <Button onClick={printFile} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Stamped PDF
              </Button>
              <Button variant="outline" onClick={resetProcess}>
                Stamp Another
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
            onClick={() => currentStep === "upload" ? navigate("/pdf-tools") : setCurrentStep("upload")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stamp PDF</h1>
            <p className="text-muted-foreground">Add text or image stamps/watermarks to your PDF documents.</p>
          </div>
        </div>

        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "download" && renderDownloadStep()}
      </div>
    </div>
  );
};

export default StampPDF;