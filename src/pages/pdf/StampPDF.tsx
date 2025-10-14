import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Upload, Download, Check, Stamp, Type,
  Image as ImageIcon, Printer
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

type ProcessStep = "upload" | "processing" | "download";

const StampPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [stampType, setStampType] = useState<string>("text");
  const [stampText, setStampText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(50);
  const [stampedPdf, setStampedPdf] = useState<Uint8Array | null>(null);
  const [imageStamp, setImageStamp] = useState<File | null>(null);

  // ✅ refs for file pickers
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("PDF file uploaded successfully");
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImage = event.target.files?.[0];
    if (selectedImage) {
      setImageStamp(selectedImage);
      toast.success("Image uploaded for stamp");
    }
  };

  const addStamp = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }
    setCurrentStep("processing");
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

if (stampType === "text") {
  const pages = pdfDoc.getPages();
  const red = rgb(0.8, 0, 0);
  const lightRed = rgb(1, 0.9, 0.9);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const commonOpacity = opacity / 100; // unified opacity

  for (const page of pages) {
    const width = page.getWidth();
    const height = page.getHeight();

    const text = stampText.toUpperCase();
    const textSize = 20;

    // measure text width and height
    const textWidth = font.widthOfTextAtSize(text, textSize);
    const textHeight = textSize * 1.2;

    // rectangle size based on text + padding
    const paddingX = 40;
    const paddingY = 25;
    const stampWidth = textWidth + paddingX;
    const stampHeight = textHeight + paddingY;
    const rotation = degrees(15);

    // ✅ adjustY fixes visual imbalance caused by rotation
    const adjustY = 20; // move slightly upward (tweak as needed)
    const centerX = width / 2 - stampWidth / 2;
    const centerY = height / 2 - stampHeight / 2 + adjustY;

    // background rectangle
    page.drawRectangle({
      x: centerX,
      y: centerY,
      width: stampWidth,
      height: stampHeight,
      borderColor: red,
      borderWidth: 3,
      color: lightRed,
      opacity: commonOpacity,
      rotate: rotation,
    });

    // perfectly centered text
    const textX = centerX + (stampWidth - textWidth) / 2;
    const textY = centerY + (stampHeight - textHeight) / 2 + 6;

    page.drawText(text, {
      x: textX,
      y: textY,
      size: textSize,
      font,
      color: red,
      opacity: commonOpacity,
      rotate: rotation,
    });
  }
      } else if (stampType === "image" && imageStamp) {
        const imgBytes = await imageStamp.arrayBuffer();
        const ext = imageStamp.name.split(".").pop()?.toLowerCase();
        let image;
        if (ext === "png") {
          image = await pdfDoc.embedPng(imgBytes);
        } else {
          image = await pdfDoc.embedJpg(imgBytes);
        }
        const pages = pdfDoc.getPages();
        pages.forEach((page) => {
          const { width, height } = image.scale(0.5);
          page.drawImage(image, {
            x: page.getWidth() / 2 - width / 2,
            y: page.getHeight() / 2 - height / 2,
            width,
            height,
            opacity: opacity / 100,
          });
        });
      }

      const pdfBytes = await pdfDoc.save();
      setStampedPdf(pdfBytes);

      let currentProgress = 20;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 20;
        if (currentProgress >= 100) {
          currentProgress = 100;
          setProgress(100);
          clearInterval(interval);
          setTimeout(() => setCurrentStep("download"), 500);
        }
        setProgress(currentProgress);
      }, 170);
    } catch (err) {
      console.error(err);
      toast.error("Error applying stamp");
      setCurrentStep("upload");
    }
  };

  const downloadFile = () => {
    if (!stampedPdf) return;
    const blob = new Blob([stampedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stamped_${file?.name}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Stamped PDF downloaded successfully!");
  };

  const printFile = () => {
    if (!stampedPdf) return;
    const blob = new Blob([stampedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url);
    if (win) {
      win.print();
    }
  };

  const resetProcess = () => {
    setFile(null);
    setStampedPdf(null);
    setCurrentStep("upload");
    setProgress(0);
  };

  const predefinedStamps = [
    "CONFIDENTIAL", "DRAFT", "APPROVED", "REJECTED",
    "URGENT", "COPY", "ORIGINAL", "REVIEWED"
  ];

  // ---------------- UI Steps -----------------
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
                
                {/* ✅ Button opens file input via ref */}
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
                  <Button 
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
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
            <Stamp className="h-10 w-10 text-primary animate-pulse mx-auto" />
            <h3 className="text-xl font-semibold mb-2">Adding Stamp...</h3>
            <p className="text-muted-foreground">{file?.name}</p>
            <Progress value={progress} className="h-3" />
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Stamp Applied!</h3>
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
    <div className="w-full p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => currentStep === "upload" ? navigate("/pdf-tools") : setCurrentStep("upload")}
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
