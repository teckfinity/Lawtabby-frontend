import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, Scissors, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";
import { splitPDF as splitPDFApi } from "@/api/api";   // ✅ import API

type ProcessStep = "upload" | "processing" | "download";
type SplitMode = "range" | "pages" | "size";
type RangeMode = "custom" | "fixed";
type ExtractMode = "all" | "select";

interface PageRange {
  id: string;
  from: number;
  to: number;
}

const SplitPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [splitMode, setSplitMode] = useState<SplitMode>("range");
  const [rangeMode, setRangeMode] = useState<RangeMode>("custom");
  const [extractMode, setExtractMode] = useState<ExtractMode>("all");
  const [ranges, setRanges] = useState<PageRange[]>([{ id: "1", from: 1, to: 5 }]);
  const [mergeRanges, setMergeRanges] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState(217);
  const [sizeUnit, setSizeUnit] = useState<"KB" | "MB">("KB");
  const [allowCompression, setAllowCompression] = useState(false);
  const [pagesToExtract, setPageToExtract] = useState("");
  const [mergeExtracted, setMergeExtracted] = useState(false);

  // store API response (download URLs)
  const [splitFiles, setSplitFiles] = useState<string[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("PDF file uploaded successfully");
    }
    event.target.value = "";
  };

  const addRange = () => {
    const newId = String(ranges.length + 1);
    setRanges([...ranges, { id: newId, from: 1, to: 5 }]);
  };

  const removeRange = (id: string) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((r) => r.id !== id));
    }
  };

  const updateRange = (id: string, field: "from" | "to", value: number) => {
    setRanges(ranges.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ✅ Fixed API call to use backend's response format
  const splitPDF = async () => {
    if (!file) {
      toast.error("Please upload a PDF file first");
      return;
    }

    setCurrentStep("processing");
    setProgress(20);

    try {
      const response = await splitPDFApi(file);
      const fileUrl: string | undefined = response.data?.split_pdf?.split_pdf;
      if (fileUrl) {
        setSplitFiles([fileUrl]);
      }

      let currentProgress = 20;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 20;
        if (currentProgress >= 100) {
          currentProgress = 100;
          setProgress(100);
          clearInterval(interval);

          // ✅ after API success → go to download step
          setTimeout(() => {
            setCurrentStep("download");
          }, 500);
        }
        setProgress(currentProgress);
      }, 200);

      console.log("Split PDF response:", response.data);
      toast.success("PDF split successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to split PDF");
      setCurrentStep("upload");
      setProgress(0);
    }
  };

  // ✅ Proper file download
  const downloadFiles = async () => {
    if (!splitFiles.length) {
      toast.error("No split files available for download.");
      return;
    }

    try {
      for (let i = 0; i < splitFiles.length; i++) {
        const fileUrl = splitFiles[i];
        const response = await fetch(fileUrl, { method: "GET" });
        if (!response.ok) throw new Error("Failed to fetch split PDF");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `split_part_${i + 1}.pdf`;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download split files. Please try again.");
    }
  };

  const resetProcess = () => {
    setFile(null);
    setCurrentStep("upload");
    setProgress(0);
    setRanges([{ id: "1", from: 1, to: 5 }]);
    setSplitFiles([]);
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF to Split</h3>
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
            <div className="space-y-4">
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
            </div>
          )}
        </CardContent>
      </Card>

      {file && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-center mb-6">Split</h3>
            
            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setSplitMode("range")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  splitMode === "range"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl">📄</div>
                  <span className="text-sm font-medium">Range</span>
                </div>
              </button>

              <button
                onClick={() => setSplitMode("pages")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  splitMode === "pages"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl">📑</div>
                  <span className="text-sm font-medium">Pages</span>
                </div>
              </button>

              <button
                onClick={() => setSplitMode("size")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  splitMode === "size"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl">📊</div>
                  <span className="text-sm font-medium">Size</span>
                </div>
              </button>
            </div>

            {/* Range Mode */}
            {splitMode === "range" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Range mode:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setRangeMode("custom")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        rangeMode === "custom"
                          ? "border-red-500 text-red-600"
                          : "border-border"
                      }`}
                    >
                      Custom ranges
                    </button>
                    <button
                      onClick={() => setRangeMode("fixed")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        rangeMode === "fixed"
                          ? "border-red-500 text-red-600"
                          : "border-border"
                      }`}
                    >
                      Fixed ranges
                    </button>
                  </div>
                </div>

                {rangeMode === "custom" && (
                  <div className="space-y-3">
                    {ranges.map((range, index) => (
                      <div key={range.id} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>Range {index + 1}</span>
                          {ranges.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRange(range.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">
                              from page
                            </label>
                            <Input
                              type="number"
                              value={range.from}
                              onChange={(e) => updateRange(range.id, "from", parseInt(e.target.value) || 1)}
                              min={1}
                              className="text-center"
                            />
                          </div>
                          <span className="mt-5 text-muted-foreground">to</span>
                          <div className="flex-1">
                            <Input
                              type="number"
                              value={range.to}
                              onChange={(e) => updateRange(range.id, "to", parseInt(e.target.value) || 5)}
                              min={range.from}
                              className="text-center mt-5"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={addRange}
                      variant="outline"
                      className="w-full border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Range
                    </Button>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="merge"
                        checked={mergeRanges}
                        onCheckedChange={(checked) => setMergeRanges(checked as boolean)}
                      />
                      <label htmlFor="merge" className="text-sm cursor-pointer">
                        Merge all ranges in one PDF file.
                      </label>
                    </div>
                  </div>
                )}

                {rangeMode === "fixed" && (
                  <div className="space-y-4">
                    <div>
                      <label className="font-semibold mb-3 block">
                        Split into page ranges of:
                      </label>
                      <Input
                        type="number"
                        value={ranges[0].to}
                        onChange={(e) => updateRange(ranges[0].id, "to", parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-full"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                      <p className="text-blue-900">
                        This PDF will be split into files of {ranges[0].to} pages.{" "}
                        <span className="font-semibold">5 PDFs</span> will be created.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pages Mode */}
            {splitMode === "pages" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Extract mode:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExtractMode("all")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        extractMode === "all"
                          ? "border-red-500 text-red-600"
                          : "border-border"
                      }`}
                    >
                      Extract all pages
                    </button>
                    <button
                      onClick={() => setExtractMode("select")}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        extractMode === "select"
                          ? "border-red-500 text-red-600"
                          : "border-border"
                      }`}
                    >
                      Select pages
                    </button>
                  </div>
                </div>

                {extractMode === "all" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                    <p className="text-blue-900">
                      Selected pages will be converted into separate PDF files.{" "}
                      <span className="font-semibold">5 PDF</span> will be created.
                    </p>
                  </div>
                )}

                {extractMode === "select" && (
                  <div className="space-y-4">
                    <div>
                      <label className="font-semibold mb-3 block">
                        Pages to extract:
                      </label>
                      <Input
                        type="text"
                        placeholder="example: 1,5-8"
                        value={pagesToExtract}
                        onChange={(e) => setPageToExtract(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="merge-extracted"
                        checked={mergeExtracted}
                        onCheckedChange={(checked) => setMergeExtracted(checked as boolean)}
                      />
                      <label htmlFor="merge-extracted" className="text-sm cursor-pointer">
                        Merge extracted pages into one PDF file.
                      </label>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                      <p className="text-blue-900">
                        Selected pages will be converted into separate PDF files.{" "}
                        <span className="font-semibold">1 PDF</span> will be created.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Size Mode */}
            {splitMode === "size" && (
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Original file size:</span>{" "}
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <p>
                    <span className="font-medium">Total pages:</span> 5
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Maximum size per file:</h4>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={maxFileSize}
                      onChange={(e) => setMaxFileSize(parseInt(e.target.value) || 0)}
                      className="flex-1 text-center"
                    />
                    <div className="flex border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setSizeUnit("KB")}
                        className={`px-4 py-2 transition-colors ${
                          sizeUnit === "KB"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        KB
                      </button>
                      <button
                        onClick={() => setSizeUnit("MB")}
                        className={`px-4 py-2 transition-colors ${
                          sizeUnit === "MB"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        MB
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <p className="text-blue-900">
                    This PDF will be split into files no larger than {maxFileSize} {sizeUnit} each.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compression"
                    checked={allowCompression}
                    onCheckedChange={(checked) => setAllowCompression(checked as boolean)}
                  />
                  <label htmlFor="compression" className="text-sm cursor-pointer">
                    Allow compression
                  </label>
                </div>
              </div>
            )}

            <Button
              onClick={splitPDF}
              className="w-full bg-red-600 hover:bg-red-700 text-white mt-6 h-12 text-base"
            >
              Split PDF →
            </Button>
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
                <Scissors className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Splitting PDF...</h3>
              <p className="text-muted-foreground">{file?.name} ({(file?.size / 1024 / 1024)?.toFixed(2)}mb)</p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">PROCESSING</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDownloadStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-primary">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">PDF split successfully!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Your PDF has been split. Download it below or continue with other tools.
          </p>

          <div className="space-y-3 mb-6">
            {splitFiles.map((url, index) => (
              <div key={index} className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                    <span className="text-red-600 font-bold text-xs">PDF</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-sm">split_part_{index + 1}.pdf</h4>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {url}
                    </a>
                  </div>
                </div>
              </div>
            ))}
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
              onClick={downloadFiles}
              className="bg-primary hover:bg-primary/90 h-12 px-8"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
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

          <PDFToolRecommendations currentTool="split" />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              currentStep === "upload"
                ? navigate("/pdf-tools")
                : setCurrentStep("upload")
            }
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Split PDF</h1>
            <p className="text-muted-foreground">
              Extract or split pages from a PDF document.
            </p>
          </div>
        </div>

        {/* hidden input for upload */}
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

export default SplitPDF;
