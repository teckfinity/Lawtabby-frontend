import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { protectPDF as protectPDFApi } from "@/api";
import { PDFToolDownloadResult } from "@/components/pdf/PDFToolDownloadResult";
import { PdfLibraryPickButton } from "@/components/library/LibraryFileSourceButtons";
import { buildLexorbitProcessedFilename } from "@/utils/lexorbitFilename";

type ProcessStep = "upload" | "processing" | "download";

const ProtectPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [protectedFileUrl, setProtectedFileUrl] = useState<string | null>(null);
  const [protectedDownloadName, setProtectedDownloadName] = useState("");

  const [permissions, setPermissions] = useState({
    printing: true,
    copying: true,
    editing: false,
    commenting: true,
    filling: true,
    assembly: false,
    degradedPrinting: false,
  });

  const resetProcess = () => {
    setFile(null);
    setPassword("");
    setConfirmPassword("");
    setProtectedFileUrl(null);
    setProtectedDownloadName("");
    setProgress(0);
    setCurrentStep("upload");
  };

  const selectPdfFile = (selectedFile: File) => {
    setFile(selectedFile);
    toast.success("PDF file uploaded successfully");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) selectPdfFile(selectedFile);
    event.target.value = "";
  };

  const protectPDF = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }

    if (!password) {
      toast.error("Please enter a password");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setCurrentStep("processing");
    setProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 80) {
        currentProgress = 80;
        clearInterval(interval);
      }
      setProgress(currentProgress);
    }, 150);

    try {
      const response = await protectPDFApi({
        file,
        password,
        allow_printing: permissions.printing,
        allow_copying: permissions.copying,
        allow_editing: permissions.editing,
        allow_comments: permissions.commenting,
        allow_form_filling: permissions.filling,
        allow_document_assembly: permissions.assembly,
      });

      let fileUrl = response?.data?.split_pdf?.protected_file;
      if (!fileUrl) throw new Error("No protected file URL returned from server");

      if (window.location.protocol === "https:" && fileUrl.startsWith("http://")) {
        fileUrl = fileUrl.replace("http://", "https://");
      }

      setProtectedFileUrl(fileUrl);
      setProtectedDownloadName(buildLexorbitProcessedFilename(file.name, "protected"));
      setProgress(100);
      setTimeout(() => setCurrentStep("download"), 450);
      toast.success("PDF protected — review and download when ready.");
    } catch (error) {
      console.error("Error protecting PDF:", error);
      toast.error("Failed to protect PDF. Please try again.");
      setCurrentStep("upload");
      setProgress(0);
    } finally {
      clearInterval(interval);
    }
  };

  const downloadFile = async () => {
    if (!protectedFileUrl || !file) return;

    toast.success("Download started!");

    try {
      let downloadUrl = protectedFileUrl;
      if (window.location.protocol === "https:" && downloadUrl.startsWith("http://")) {
        downloadUrl = downloadUrl.replace("http://", "https://");
      }

      const downloadResponse = await fetch(downloadUrl);
      if (!downloadResponse.ok) throw new Error("Failed to fetch protected PDF");

      const blob = await downloadResponse.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = protectedDownloadName || buildLexorbitProcessedFilename(file.name, "protected");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Protected PDF saved.");
    } catch (error) {
      console.error(error);
      toast.error("Download failed — try again or open the link in a new tab.");
    }
  };

  const permissionOptions = [
    { key: "printing" as const, label: "Allow Printing", description: "Users can print the document" },
    { key: "copying" as const, label: "Allow Copying Text", description: "Users can copy and extract text" },
    { key: "editing" as const, label: "Allow Editing", description: "Users can modify the document content" },
    { key: "commenting" as const, label: "Allow Comments", description: "Users can add comments and annotations" },
    { key: "filling" as const, label: "Allow Form Filling", description: "Users can fill out form fields" },
    { key: "assembly" as const, label: "Allow Document Assembly", description: "Users can insert, delete, or rotate pages" },
  ];

  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <Card>
        <CardContent className="p-12">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Protecting PDF…</h3>
              <p className="text-muted-foreground">
                {file?.name}
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">ENCRYPTING</div>
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
            <h1 className="text-3xl font-bold text-foreground">Protect PDF</h1>
            <p className="text-muted-foreground">
              Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.
            </p>
          </div>
        </div>

        {currentStep === "upload" && (
          <div className="space-y-8">
            <Card>
              <CardContent className="p-8">
                {!file ? (
                  <div className="text-center">
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Upload PDF to Protect</h3>
                      <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
                      <input id="pdf-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                          type="button"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => (document.getElementById("pdf-upload") as HTMLInputElement)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Select PDF File
                        </Button>
                        <PdfLibraryPickButton onFileReady={selectPdfFile} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xs">PDF</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetProcess}>
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {file && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Password Protection</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                      />
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-sm text-red-600">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {file && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Document Permissions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Control what users can do with the protected PDF document
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissionOptions.map((option) => (
                      <div key={option.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={option.key}
                          checked={permissions[option.key]}
                          onCheckedChange={(checked) =>
                            setPermissions((prev) => ({
                              ...prev,
                              [option.key]: checked === true,
                            }))
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor={option.key} className="text-sm font-medium leading-none">
                            {option.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {file && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={protectPDF}
                  disabled={!password || password !== confirmPassword}
                  className="bg-primary hover:bg-primary/90 px-8"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Protect PDF
                </Button>
              </div>
            )}

            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Security Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Encryption</h4>
                    <ul className="space-y-1">
                      <li>• 128-bit AES encryption</li>
                      <li>• Password-based security</li>
                      <li>• Granular permission control</li>
                      <li>• Compatible with standard PDF readers</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Best Practices</h4>
                    <ul className="space-y-1">
                      <li>• Use strong passwords</li>
                      <li>• Store passwords securely</li>
                      <li>• Do not share passwords in plain email</li>
                      <li>• Keep an unencrypted backup where allowed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === "processing" && renderProcessingStep()}

        {currentStep === "download" && file && protectedFileUrl && (
          <PDFToolDownloadResult
            title="PDF protected!"
            description="Download your password-protected PDF. The file stays on Lawtabby until you download it."
            outputFilename={protectedDownloadName || buildLexorbitProcessedFilename(file.name, "protected")}
            sourceSummary={`Original upload: ${file.name}`}
            onDownload={downloadFile}
            onReset={resetProcess}
            downloadButtonLabel="Download protected PDF"
            currentTool="protect"
          />
        )}
      </div>
    </div>
  );
};

export default ProtectPDF;
