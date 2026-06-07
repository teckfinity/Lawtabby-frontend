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
import { splitPDF as splitPDFApi } from "@/api";
import {
  buildLexorbitProcessedFilename,
  triggerBlobDownload,
} from "@/utils/lexorbitFilename";

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

  // Store final downloadable URL + metadata
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isZip, setIsZip] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("PDF uploaded successfully");
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

  const splitPDF = async () => {
    if (!file) {
      toast.error("Please upload a PDF first");
      return;
    }

    setCurrentStep("processing");
    setProgress(15);

    try {
      const response = await splitPDFApi({
        file,
        split_mode: splitMode,
        range_mode: rangeMode,
        ranges: splitMode === "range" ? JSON.stringify(ranges.map(r => ({ from: r.from, to: r.to }))) : undefined,
        merge_ranges: mergeRanges,
        extract_mode: extractMode,
        pages_to_extract: extractMode === "select" ? pagesToExtract : undefined,
        merge_extracted: mergeExtracted,
        max_file_size: splitMode === "size" ? String(maxFileSize) : undefined,
        size_unit: sizeUnit,
        allow_compression: allowCompression,
      });

      const data = response.data;
      const url = data?.split_pdf?.split_pdf;

      if (!url) throw new Error("No download URL received");

      // Extract metadata
      const isZipFile = data?.is_zip === true;
      const count = data?.total_files_created || 1;

      const cleanName =
        data?.download_filename ??
        buildLexorbitProcessedFilename(
          file.name,
          "split",
          isZipFile ? "zip" : "pdf",
        );

      setDownloadUrl(url);
      setFileName(cleanName);
      setIsZip(isZipFile);
      setFileCount(count);

      // Fake progress
      let prog = 15;
      const interval = setInterval(() => {
        prog += Math.random() * 18;
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => setCurrentStep("download"), 600);
        }
        setProgress(prog);
      }, 180);

      toast.success(data?.message || "PDF split successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Split failed. Try again.");
      setCurrentStep("upload");
      setProgress(0);
    }
  };

  const downloadFile = async () => {
    if (!downloadUrl) {
      toast.error("No file to download");
      return;
    }

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      triggerBlobDownload(blob, fileName);

      toast.success(`${isZip ? "ZIP" : "PDF"} downloaded!`);
    } catch (err) {
      toast.error("Download error");
    }
  };

  const resetAll = () => {
    setFile(null);
    setCurrentStep("upload");
    setProgress(0);
    setDownloadUrl("");
    setFileName("");
    setIsZip(false);
    setFileCount(0);
    setRanges([{ id: "1", from: 1, to: 5 }]);
  };

  // === RENDER STEPS ===
  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF to Split</h3>
                <p className="text-muted-foreground mb-4">Choose a PDF file</p>
                <Button onClick={() => document.getElementById("pdf-upload")?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select PDF
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
            <h3 className="text-xl font-semibold text-center mb-6">Split Options</h3>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(["range", "pages", "size"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSplitMode(mode)}
                  className={`p-4 rounded-lg border-2 transition-all capitalize ${
                    splitMode === mode
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl">
                      {mode === "range" ? "📄" : mode === "pages" ? "📑" : "📊"}
                    </div>
                    <span className="text-sm font-medium">{mode}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* === RANGE MODE === */}
            {splitMode === "range" && (
              <div className="space-y-5">
                <div>
                  <h4 className="font-medium mb-2">Range type:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(["custom", "fixed"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setRangeMode(m)}
                        className={`p-3 rounded border-2 capitalize ${
                          rangeMode === m ? "border-red-500 text-red-600" : "border-border"
                        }`}
                      >
                        {m === "custom" ? "Custom ranges" : "Fixed size"}
                      </button>
                    ))}
                  </div>
                </div>

                {rangeMode === "custom" && (
                  <>
                    {ranges.map((r, i) => (
                      <div key={r.id} className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground">From</label>
                          <Input
                            type="number"
                            value={r.from}
                            onChange={(e) => updateRange(r.id, "from", parseInt(e.target.value) || 1)}
                            min={1}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground">To</label>
                          <Input
                            type="number"
                            value={r.to}
                            onChange={(e) => updateRange(r.id, "to", parseInt(e.target.value) || 1)}
                            min={r.from}
                          />
                        </div>
                        {ranges.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeRange(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button onClick={addRange} variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Add Range
                    </Button>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="merge"
                        checked={mergeRanges}
                        onCheckedChange={(v) => setMergeRanges(!!v)}
                      />
                      <label htmlFor="merge" className="text-sm">
                        Merge all into one PDF
                      </label>
                    </div>
                  </>
                )}

                {rangeMode === "fixed" && (
                  <div>
                    <label className="font-medium">Pages per file:</label>
                    <Input
                      type="number"
                      value={ranges[0].to}
                      onChange={(e) => updateRange(ranges[0].id, "to", parseInt(e.target.value) || 1)}
                      min={1}
                    />
                  </div>
                )}
              </div>
            )}

            {/* === PAGES MODE === */}
            {splitMode === "pages" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Extract:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(["all", "select"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setExtractMode(m)}
                        className={`p-3 rounded border-2 capitalize ${
                          extractMode === m ? "border-red-500 text-red-600" : "border-border"
                        }`}
                      >
                        {m === "all" ? "All pages" : "Select pages"}
                      </button>
                    ))}
                  </div>
                </div>

                {extractMode === "select" && (
                  <>
                    <Input
                      placeholder="e.g. 1, 3-5, 8"
                      value={pagesToExtract}
                      onChange={(e) => setPageToExtract(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="merge-ex"
                        checked={mergeExtracted}
                        onCheckedChange={(v) => setMergeExtracted(!!v)}
                      />
                      <label htmlFor="merge-ex" className="text-sm">
                        Merge into one PDF
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* === SIZE MODE === */}
            {splitMode === "size" && (
              <div className="space-y-4">
                <div>
                  <label className="font-medium">Max size per file:</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={maxFileSize}
                      onChange={(e) => setMaxFileSize(parseInt(e.target.value) || 0)}
                    />
                    <div className="flex">
                      {(["KB", "MB"] as const).map((u) => (
                        <button
                          key={u}
                          onClick={() => setSizeUnit(u)}
                          className={`px-3 py-2 ${sizeUnit === u ? "bg-primary text-white" : "bg-muted"}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="compress"
                    checked={allowCompression}
                    onCheckedChange={(v) => setAllowCompression(!!v)}
                  />
                  <label htmlFor="compress" className="text-sm">
                    Allow compression
                  </label>
                </div>
              </div>
            )}

            <Button
              onClick={splitPDF}
              className="w-full mt-6 h-12 text-lg bg-red-600 hover:bg-red-700"
            >
              Split PDF →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto text-center py-12">
      <Card>
        <CardContent className="p-12">
          <div className="space-y-8">
            <Scissors className="h-16 w-16 mx-auto text-primary animate-pulse" />
            <div>
              <h3 className="text-2xl font-bold">Splitting your PDF...</h3>
              <p className="text-muted-foreground mt-2">{file?.name}</p>
            </div>
            <div className="space-y-3">
              <Progress value={progress} className="h-4" />
              <p className="text-3xl font-bold">{Math.round(progress)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDownloadStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-primary">
        <CardContent className="p-10 text-center">
          <h2 className="text-2xl font-bold mb-3">PDF split successfully!</h2>
          <p className="text-muted-foreground mb-8">
            {isZip
              ? `${fileCount} files created & zipped`
              : "Your PDF has been split"}
          </p>

          <div className="bg-muted rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 bg-red-100 rounded flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">
                  {isZip ? "ZIP" : "PDF"}
                </span>
              </div>
              <div className="text-left">
                <p className="font-semibold">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {isZip ? "Contains all split PDFs" : "Ready to download"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" size="icon" onClick={resetAll}>
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <Button onClick={downloadFile} className="px-10">
              <Download className="h-5 w-5 mr-2" />
              Download {isZip ? "ZIP" : "PDF"}
            </Button>

            <Button variant="outline" size="icon" onClick={resetAll}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-10">
            <PDFToolRecommendations currentTool="split" />
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
            <h1 className="text-3xl font-bold text-foreground">Split PDF</h1>
            <p className="text-muted-foreground">Extract or split pages from a PDF document.</p>
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
