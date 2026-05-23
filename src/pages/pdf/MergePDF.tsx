import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, RotateCcw, Trash2, Download, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { PDFToolDownloadResult } from "@/components/pdf/PDFToolDownloadResult";
import { mergePDFs } from "@/api"; // Import the mergePDFs API


function summarizeSourceFiles(names: string[], maxChars = 120): string {
  const joined = names.join(" · ");
  if (joined.length <= maxChars) return joined;
  return `${joined.slice(0, Math.max(0, maxChars - 3))}…`;
}

interface PDFFile {
  id: string;
  name: string;
  size: string;
  preview: string;
  file: File; // Store the actual File object
  mergedFileUrl?: string; // Optional mergedFileUrl property
}

type ProcessStep = "upload" | "processing" | "download";

const MergePDF = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessStep>("upload");
  const [progress, setProgress] = useState(0);
  const [processedFileName, setProcessedFileName] = useState("");
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null);

  // Validate if a file is a valid PDF
  const isValidPDF = async (file: File): Promise<boolean> => {
    try {
      if (file.size === 0 || file.size > 100 * 1024 * 1024) return false;
      const headerBuffer = await file.slice(0, 5).arrayBuffer();
      const header = new Uint8Array(headerBuffer);
      if (
        header[0] !== 0x25 ||
        header[1] !== 0x50 ||
        header[2] !== 0x44 ||
        header[3] !== 0x46 ||
        header[4] !== 0x2d
      ) {
        return false;
      }
      const trailerBuffer = await file.slice(-1024).arrayBuffer();
      const trailer = new TextDecoder().decode(trailerBuffer);
      if (!trailer.includes("%%EOF")) {
        console.warn(`Warning: PDF ${file.name} missing EOF marker, accepting anyway.`);
      }
      return true;
    } catch (error) {
      console.error(`Error validating PDF ${file.name}:`, error);
      return false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      if (await isValidPDF(file)) validFiles.push(file);
      else toast.error(`Invalid PDF: ${file.name}`);
    }
    if (validFiles.length === 0) {
      toast.error("No valid PDF files selected");
      return;
    }
    const newFiles = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}mb`,
      preview: `Sample PDF content for ${file.name}`,
      file,
    }));
    setFiles([...files, ...newFiles]);
    toast.success(`Added ${validFiles.length} valid PDF file(s)`);
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles: File[] = [];
    for (const file of droppedFiles) {
      if (await isValidPDF(file)) validFiles.push(file);
      else toast.error(`Invalid PDF: ${file.name}`);
    }
    if (validFiles.length === 0) {
      toast.error("No valid PDF files dropped");
      return;
    }
    const newFiles = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}mb`,
      preview: `Sample PDF content for ${file.name}`,
      file,
    }));
    setFiles([...files, ...newFiles]);
    toast.success(`Added ${validFiles.length} valid PDF file(s)`);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    toast.success("File removed");
  };

  const resetProcess = () => {
    setFiles([]);
    setCurrentStep("upload");
    setProgress(0);
    setProcessedFileName("");
  };

  const mergePDFsHandler = async () => {
    if (files.length < 2) {
      toast.error("Please select at least 2 PDF files to merge");
      return;
    }
    setCurrentStep("processing");
    setProcessedFileName(`merged_${files.length}_files.pdf`);
    let progressInterval: any = undefined;
    try {
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 90) currentProgress = 90;
        setProgress(currentProgress);
      }, 200);

      const fileObjects = files.map(f => f.file);
      const response = await mergePDFs(fileObjects);

      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);

      const mergedFileUrl = response.data?.merged_data?.merged_file;
      if (!mergedFileUrl) throw new Error("No merged file URL received from server");

      setFiles(prevFiles =>
        prevFiles.map((file, index) => ({
          ...file,
          mergedFileUrl: index === 0 ? mergedFileUrl : undefined,
        }))
      );
      setTimeout(() => setCurrentStep("download"), 500);
    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
      setProgress(0);
      setCurrentStep("upload");
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to merge PDFs. Please ensure all files are valid PDFs.";
      toast.error(`Merge failed: ${errorMessage}`);
      console.error("Merge PDF error:", error);
    }
  };

  const downloadFile = async () => {
    const mergedFileUrl = files.find(f => f.mergedFileUrl)?.mergedFileUrl;
    if (!mergedFileUrl) {
      toast.error("No merged file available for download.");
      return;
    }

    try {
      // Fetch the PDF file from the mergedFileUrl
      const response = await fetch(mergedFileUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch merged PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Force download
      const link = document.createElement("a");
      link.href = url;
      link.download = processedFileName || `merged_${files.length}_files.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file. Please try again.");
    }
  };

  const printFile = () => {
    const mergedFileUrl = files.find(f => f.mergedFileUrl)?.mergedFileUrl;
    if (mergedFileUrl) {
      const newWindow = window.open(mergedFileUrl);
      if (newWindow) newWindow.onload = () => newWindow.print();
      toast.success("Opening print dialog...");
    } else toast.error("No merged file available for printing.");
  };

  // Drag and drop reordering
  const handleFileDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleFileDragOver = (e: React.DragEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFileId && draggedFileId !== fileId) setDragOverFileId(fileId);
  };
  const handleFileDragLeave = () => setDragOverFileId(null);
  const handleFileDrop = (e: React.DragEvent, targetFileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedFileId || draggedFileId === targetFileId) {
      setDraggedFileId(null);
      setDragOverFileId(null);
      return;
    }
    const draggedIndex = files.findIndex(f => f.id === draggedFileId);
    const targetIndex = files.findIndex(f => f.id === targetFileId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const newFiles = [...files];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(targetIndex, 0, draggedFile);
    setFiles(newFiles);
    setDraggedFileId(null);
    setDragOverFileId(null);
    toast.success("Files reordered");
  };
  const handleFileDragEnd = () => {
    setDraggedFileId(null);
    setDragOverFileId(null);
  };

  // Render upload step
  const renderUploadStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3">
        {files.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
            <CardContent
              className={`p-12 text-center ${isDragOver ? "bg-primary/5" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl text-muted-foreground">PDF</div>
                <h3 className="text-xl font-semibold">Drag and drop PDF here</h3>
                <p className="text-muted-foreground">or</p>
                <Button
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Select PDF file
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Merge PDF</h3>
              <p className="text-sm text-muted-foreground">
                {files.length > 1
                  ? "To change the order of your PDFs, drag and drop."
                  : "Please select more PDF files"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file, index) => (
                <Card
                  key={file.id}
                  className={`relative cursor-move transition-all ${
                    draggedFileId === file.id ? "opacity-50 scale-95" : ""
                  } ${dragOverFileId === file.id ? "ring-2 ring-primary" : ""}`}
                  draggable
                  onDragStart={e => handleFileDragStart(e, file.id)}
                  onDragOver={e => handleFileDragOver(e, file.id)}
                  onDragLeave={handleFileDragLeave}
                  onDrop={e => handleFileDrop(e, file.id)}
                  onDragEnd={handleFileDragEnd}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-20 bg-muted rounded border flex items-center justify-center text-xs">
                        PDF
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{file.name}</h4>
                        <p className="text-sm text-muted-foreground">{file.size}</p>
                        <div className="mt-2 p-2 bg-muted rounded text-xs">{file.preview}...</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                  <div className="absolute top-2 right-8 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-center">
              <Button
                onClick={mergePDFsHandler}
                className="bg-primary hover:bg-primary/90 px-8"
                disabled={files.length < 2}
              >
                <Download className="h-4 w-4 mr-2" />
                Merge PDF
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => document.getElementById("file-upload")?.click()}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add More
          </Button>
          <Button variant="outline" className="w-full" onClick={resetProcess}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Features</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Drag and drop to reorder</li>
            <li>• No file size limits</li>
            <li>• Secure processing</li>
            <li>• High-quality output</li>
          </ul>
        </Card>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <Card>
        <CardContent className="p-12">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Uploading file {files.length} of {files.length}
              </h3>
              <p className="text-muted-foreground">
                {processedFileName} (
                {files
                  .reduce((total, file) => total + parseFloat(file.size), 0)
                  .toFixed(2)}
                mb)
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">UPLOADED</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDownloadStep = () => (
    <PDFToolDownloadResult
      title="PDFs merged successfully"
      description="Download your merged PDF, or reset to choose different files."
      outputFilename={processedFileName || `merged_${files.length}_files.pdf`}
      sourceSummary={`Original files: ${summarizeSourceFiles(files.map((f) => f.name))}`}
      onDownload={downloadFile}
      onReset={resetProcess}
      downloadButtonLabel="Download merged PDF"
      currentTool="merge"
    />
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
            <h1 className="text-3xl font-bold text-foreground">Merge PDF files</h1>
            <p className="text-muted-foreground">Combine PDFs in the order you want.</p>
          </div>
        </div>
        <input
          id="file-upload"
          type="file"
          accept=".pdf"
          multiple
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

export default MergePDF;