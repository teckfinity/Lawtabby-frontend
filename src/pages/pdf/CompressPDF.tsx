import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { PDFToolDownloadResult } from "@/components/pdf/PDFToolDownloadResult";
import { compressPDF as compressPDFApi } from "@/api"; // import your API function

type ProcessStep = "upload" | "processing" | "download";

type CompressionStatsApi = {
  original_bytes: number;
  compressed_bytes: number;
  applied_reduction: boolean;
  tier: string;
  strategy: string;
  /** Server-reported savings; backend uses one decimal place. */
  savings_percent: number;
  compression_ratio?: number;
};

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const TIER_LABEL: Record<string, string> = {
  extreme: "High compression",
  recommended: "Balanced compression",
  less: "Mild compression (best fidelity)",
};

const CompressPDF = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [compressedFileUrl, setCompressedFileUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionStatsApi | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCompressionStats(null);
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
        const stats =
          response.data.split_pdf.compression_stats as CompressionStatsApi | undefined;
        setCompressionStats(stats ?? null);
        setProgress(100);
        setTimeout(() => setCurrentStep("download"), 500);
        toast.success("PDF processed successfully!");
        if (stats && !stats.applied_reduction) {
          toast.info(
            "File size unchanged — your PDF was already small or well optimized at this tier (server kept the original bytes).",
            { duration: 6000 },
          );
        }
      } else {
        throw new Error("No file URL returned from server");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to compress PDF");
      setCurrentStep("upload");
      setProgress(0);
    } finally {
      clearInterval(interval);
    }
  };

  const downloadFile = async () => {
    if (!compressedFileUrl) return;

    toast.success("Download started!");

    try {
      // 🧩 Fix Mixed Content issue: force HTTPS if frontend is served over HTTPS
      let downloadUrl = compressedFileUrl;
      if (window.location.protocol === "https:" && downloadUrl.startsWith("http://")) {
        downloadUrl = downloadUrl.replace("http://", "https://");
      }

      // fetch the file as blob
      const res = await fetch(downloadUrl);
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
    setCompressionStats(null);
  };

  const getCompressionInfo = () => {
    if (!file) {
      return {
        originalLabel: "—",
        compressedLabel: "—",
        savings: 0,
        tierLabel: "",
        note: "",
      };
    }

    if (compressionStats) {
      const ratio =
        compressionStats.original_bytes > 0
          ? compressionStats.compressed_bytes / compressionStats.original_bytes
          : 1;
      // Derive % from returned byte sizes so UI always matches the tier you just ran.
      const savingsPct =
        compressionStats.applied_reduction ? Math.max(0, (1 - ratio) * 100) : 0;

      return {
        originalLabel: formatFileSize(compressionStats.original_bytes),
        compressedLabel: formatFileSize(compressionStats.compressed_bytes),
        savings: savingsPct,
        tierLabel: TIER_LABEL[compressionStats.tier] ?? compressionStats.tier,
        note: compressionStats.applied_reduction
          ? ""
          : "Your PDF stayed the same size. That often happens when the file is already minimal or Ghostscript cannot beat it at this tier.",
      };
    }

    return {
      originalLabel: formatFileSize(file.size),
      compressedLabel: "—",
      savings: 0,
      tierLabel: "",
      note: "",
    };
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
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setFile(null);
                setCompressionStats(null);
              }}>
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
                      onChange={(e) => {
              setCompressionLevel(e.target.value);
              setCompressionStats(null);
            }}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium">Low Compression</span>
                      <p className="text-sm text-muted-foreground">Better quality, larger file size</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Preserve size / quality</span>
                </label>
                
                <label className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="compression"
                      value="medium"
                      checked={compressionLevel === "medium"}
                      onChange={(e) => {
              setCompressionLevel(e.target.value);
              setCompressionStats(null);
            }}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium">Medium Compression</span>
                      <p className="text-sm text-muted-foreground">Balanced quality and size</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Recommended</span>
                </label>
                
                <label className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="compression"
                      value="high"
                      checked={compressionLevel === "high"}
                      onChange={(e) => {
              setCompressionLevel(e.target.value);
              setCompressionStats(null);
            }}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium">High Compression</span>
                      <p className="text-sm text-muted-foreground">Smaller file — more aggressive presets</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Max shrink attempt</span>
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
              <p className="text-muted-foreground">{file?.name} ({formatFileSize(file?.size ?? 0)})</p>
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
    const { originalLabel, compressedLabel, savings, note, tierLabel } = getCompressionInfo();

    const statusBanner = (
      <>
        {note ? (
          <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950 rounded-md px-4 py-2 mb-3">
            {note}
          </p>
        ) : null}
        <div
          className={`text-center p-2 rounded font-medium ${
            savings > 0
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {savings > 0
            ? `${savings.toFixed(1)}% smaller vs upload (${tierLabel})`
            : "No reduction — exact original kept (searchable)"}
        </div>
      </>
    );

    return (
      <PDFToolDownloadResult
        title="Compression complete!"
        description="We only swap in a smaller PDF when it beats your upload byte-for-byte (text-first pipeline)."
        outputFilename={`compressed_${file?.name ?? "document.pdf"}`}
        sourceSummary={`${compressedLabel} (was ${originalLabel}) · ${tierLabel || "tier —"}`}
        statusBanner={statusBanner}
        onDownload={downloadFile}
        onReset={resetProcess}
        downloadButtonLabel="Download compressed PDF"
        currentTool="compress"
      />
    );
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (currentStep === "upload") {
                navigate("/pdf-tools");
                return;
              }
              setCurrentStep("upload");
              setCompressedFileUrl(null);
              setCompressionStats(null);
            }}
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