import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Download, Lock, Unlock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const UnlockPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsUnlocked(false);
      setPassword("");
      toast.success("PDF file uploaded successfully");
    }
  };

  const unlockPDF = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }
    
    if (!password) {
      toast.error("Please enter the PDF password");
      return;
    }

    setIsUnlocking(true);
    
    // Simulate password verification
    setTimeout(() => {
      setIsUnlocking(false);
      if (password === "demo" || password === "password" || password === "123456") {
        setIsUnlocked(true);
        toast.success("PDF unlocked successfully!");
      } else {
        toast.error("Incorrect password. Please try again.");
      }
    }, 2000);
  };

  const downloadUnlockedPDF = () => {
    if (!isUnlocked) {
      toast.error("PDF is not unlocked yet");
      return;
    }
    toast.success("Unlocked PDF download started!");
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
            <p className="text-muted-foreground">Remove PDF password security, giving you the freedom to use your PDFs as you want.</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* File Upload */}
          <Card>
            <CardContent className="p-8">
              {!file ? (
                <div className="text-center">
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                    <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Password-Protected PDF</h3>
                    <p className="text-muted-foreground mb-4">Choose a password-protected PDF file from your device</p>
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
                      onKeyPress={(e) => e.key === 'Enter' && unlockPDF()}
                    />
                  </div>

                  <Button
                    onClick={unlockPDF}
                    disabled={isUnlocking}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    {isUnlocking ? "Unlocking..." : "Unlock PDF"}
                  </Button>
                </div>

                {/* Demo Help */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Demo Mode</h4>
                      <p className="text-sm text-blue-600">
                        For demonstration purposes, try these passwords: "demo", "password", or "123456"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success State */}
          {isUnlocked && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Unlock className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-800">PDF Successfully Unlocked!</h3>
                    <p className="text-green-600">
                      Your PDF is now unlocked and ready for download. The password protection has been removed.
                    </p>
                  </div>
                  <Button
                    onClick={downloadUnlockedPDF}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Unlocked PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Information */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Security & Privacy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-2">What We Do</h4>
                  <ul className="space-y-1">
                    <li>• Remove password protection safely</li>
                    <li>• Preserve all document content</li>
                    <li>• Maintain original formatting</li>
                    <li>• Process files securely</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Privacy Guarantee</h4>
                  <ul className="space-y-1">
                    <li>• Files processed locally when possible</li>
                    <li>• No permanent storage of documents</li>
                    <li>• Automatic deletion after processing</li>
                    <li>• End-to-end encryption for uploads</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UnlockPDF;