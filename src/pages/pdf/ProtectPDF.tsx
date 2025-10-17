import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { protectPDF as protectPDFApi } from "@/api"; 

const ProtectPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissions, setPermissions] = useState({
    printing: true,
    copying: true,
    editing: false,
    commenting: true,
    filling: true,
    assembly: false,
    degradedPrinting: false,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("PDF file uploaded successfully");
    }
  };

  // ✅ Simplified version — no password strength or minimum length restriction
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

  // if (password.length < 6) {
  //   toast.error("Password must be at least 6 characters long");
  //   return;
  // }

    setIsProcessing(true);

    try {
      const response = await protectPDFApi(file, password);

      let fileUrl = response?.data?.split_pdf?.protected_file;
      if (!fileUrl) throw new Error("No protected file URL returned from server");

      // ✅ Force HTTPS to avoid 301 redirect or mixed-content issues
      if (fileUrl.startsWith("http://")) {
        fileUrl = fileUrl.replace("http://", "https://");
      }

      const downloadResponse = await fetch(fileUrl);
      if (!downloadResponse.ok) throw new Error("Failed to fetch protected PDF");

      const blob = await downloadResponse.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = file.name.replace(".pdf", "") + "-protected.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);

      toast.success("PDF protected and downloaded successfully ✅");
    } catch (error) {
      console.error("Error protecting PDF:", error);
      toast.error("Failed to protect PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };




  // const getPasswordStrength = (pwd: string) => {
  //   if (pwd.length === 0) return { strength: 0, label: "" };
  //   if (pwd.length < 6) return { strength: 1, label: "Weak" };
  //   if (pwd.length < 10) return { strength: 2, label: "Medium" };
  //   if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
  //     return { strength: 4, label: "Very Strong" };
  //   }
  //   if (pwd.length >= 10) return { strength: 3, label: "Strong" };
  //   return { strength: 2, label: "Medium" };
  // };

  // const passwordStrength = getPasswordStrength(password);

  const permissionOptions = [
    { key: "printing" as const, label: "Allow Printing", description: "Users can print the document" },
    { key: "copying" as const, label: "Allow Copying Text", description: "Users can copy and extract text" },
    { key: "editing" as const, label: "Allow Editing", description: "Users can modify the document content" },
    { key: "commenting" as const, label: "Allow Comments", description: "Users can add comments and annotations" },
    { key: "filling" as const, label: "Allow Form Filling", description: "Users can fill out form fields" },
    { key: "assembly" as const, label: "Allow Document Assembly", description: "Users can insert, delete, or rotate pages" },
  ];

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
            <h1 className="text-3xl font-bold text-foreground">Protect PDF</h1>
            <p className="text-muted-foreground">
              Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* File Upload */}
          <Card>
            <CardContent className="p-8">
              {!file ? (
                <div className="text-center">
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload PDF to Protect</h3>
                    <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button 
                      type="button"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => (document.getElementById("pdf-upload") as HTMLInputElement)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select PDF File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">PDF</span>
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

          {/* Password Settings */}
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
                    
                    {/* Password Strength Indicator */}
                    {/* {password && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Password Strength:</span>
                          <span
                            className={`font-medium ${
                              passwordStrength.strength === 1
                                ? "text-red-600"
                                : passwordStrength.strength === 2
                                ? "text-yellow-600"
                                : passwordStrength.strength === 3
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          >
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              passwordStrength.strength === 1
                                ? "bg-red-500 w-1/4"
                                : passwordStrength.strength === 2
                                ? "bg-yellow-500 w-2/4"
                                : passwordStrength.strength === 3
                                ? "bg-blue-500 w-3/4"
                                : "bg-green-500 w-full"
                            }`}
                          ></div>
                        </div>
                      </div>
                    )} */}
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

          {/* Permissions Settings */}
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

          {/* Apply Protection */}
          {file && (
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={protectPDF}
                disabled={!password || password !== confirmPassword || isProcessing}
                className="bg-primary hover:bg-primary/90 px-8"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Protecting...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Protect PDF
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Security Info */}
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
                    <li>• Compatible with all PDF readers</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Best Practices</h4>
                  <ul className="space-y-1">
                    <li>• Use strong passwords (recommended but optional)</li>
                    <li>• Include numbers and special characters for better safety</li>
                    <li>• Store passwords securely</li>
                    <li>• Don't share passwords publicly</li>
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

export default ProtectPDF;
