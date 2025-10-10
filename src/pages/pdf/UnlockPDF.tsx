import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Download, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { unlockPDF as unlockPDFApi } from "@/api";

const UnlockPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedFileUrl, setUnlockedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log("File selected:", event.target.files);
  const selectedFile = event.target.files?.[0];
  if (selectedFile) {
    console.log("File details:", {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    });
    setFile(selectedFile);
    setIsUnlocked(false);
    setUnlockedFileUrl(null);
    setPassword("");
    toast.success("PDF file uploaded successfully");
  }
};
  const handleButtonClick = () => {
    console.log("Button clicked");
    fileInputRef.current?.click();
  };

  const handleUnlockPDF = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }
    if (!password) {
      toast.error("Please enter the PDF password");
      return;
    }

    try {
      setIsUnlocking(true);
      const response = await unlockPDFApi(file, password);

      if (response.data?.unlocked_pdf?.unlock_pdf) {
        const unlockedFilePath = response.data.unlocked_pdf.unlock_pdf;
        const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/media/${unlockedFilePath}`;
        setUnlockedFileUrl(fullUrl);
        setIsUnlocked(true);
       toast.success(response.data.message || "PDF unlocked successfully!");
       } else {
         toast.error("Failed to unlock PDF. Please try again.");
       }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error unlocking PDF. Please try again."
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  const downloadUnlockedPDF = async () => {
    if (!isUnlocked || !unlockedFileUrl) {
      toast.error("PDF is not unlocked yet");
      return;
    }

    try {
      const res = await fetch(unlockedFileUrl, {
        headers: {
          Authorization: `Token ${localStorage.getItem("authToken") || ""}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch unlocked PDF");

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "unlocked.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Unlocked PDF downloaded!");
    } catch (error) {
      toast.error("Failed to download unlocked PDF");
    }
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-foreground">Unlock PDF</h1>
            <p className="text-muted-foreground">Remove PDF password protection and download it unlocked.</p>
          </div>
        </div>

        {/* File Upload */}
        <Card>
          <CardContent className="p-8">
            {!file ? (
              <div className="text-center">
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Password-Protected PDF</h3>
                  <Button 
                    className="bg-primary hover:bg-primary/90" 
                    onClick={handleButtonClick}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select PDF File
                  </Button>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className={`w-12 h-12 rounded flex items-center justify-center ${
                  isUnlocked ? "bg-green-100" : "bg-red-100"
                }`}>
                  {isUnlocked ? (
                    <Unlock className="h-6 w-6 text-green-600" />
                  ) : (
                    <Lock className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{file.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Status: {isUnlocked ? "Unlocked" : "Password Protected"}
                  </p>
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

        {/* Password Input */}
        {file && !isUnlocked && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Enter PDF Password</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter PDF password"
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlockPDF()}
                  />
                </div>
                <Button
                  onClick={handleUnlockPDF}
                  disabled={isUnlocking}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  {isUnlocking ? "Unlocking..." : "Unlock PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {isUnlocked && unlockedFileUrl && (
          <Card className="bg-green-50 border-green-200 mt-6">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Unlock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-600">PDF Successfully Unlocked!</h3>
                  <p className="text-green-600">Click below to download.</p>
                </div>
              </div>
              <Button
                onClick={downloadUnlockedPDF}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UnlockPDF;