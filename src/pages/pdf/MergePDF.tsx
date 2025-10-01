import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, RotateCcw, Trash2, Download, Check, FileText, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";

interface PDFFile {
  id: string;
  name: string;
  size: string;
  preview: string;
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles = selectedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}mb`,
      preview: `Sample PDF content for ${file.name}`
    }));
    setFiles([...files, ...newFiles]);
    toast.success(`Added ${selectedFiles.length} file(s)`);
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (droppedFiles.length === 0) {
      toast.error("Please drop only PDF files");
      return;
    }
    
    const newFiles = droppedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}mb`,
      preview: `Sample PDF content for ${file.name}`
    }));
    setFiles([...files, ...newFiles]);
    toast.success(`Added ${droppedFiles.length} file(s)`);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
    toast.success("File removed");
  };

  const resetProcess = () => {
    setFiles([]);
    setCurrentStep("upload");
    setProgress(0);
    setProcessedFileName("");
  };

  const mergePDFs = () => {
    if (files.length < 2) {
      toast.error("Please select at least 2 PDF files to merge");
      return;
    }
    
    setCurrentStep("processing");
    setProcessedFileName(`merged_${files.length}_files.pdf`);
    
    // Simulate processing with progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep("download");
        }, 500);
      }
      setProgress(currentProgress);
    }, 200);
  };

  const downloadFile = () => {
    toast.success("Download started!");
    setTimeout(() => {
      toast.success("File downloaded successfully!");
    }, 1000);
  };

  const printFile = () => {
    toast.success("Opening print dialog...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Drag and drop reordering functions
  const handleFileDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFileDragOver = (e: React.DragEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFileId && draggedFileId !== fileId) {
      setDragOverFileId(fileId);
    }
  };

  const handleFileDragLeave = () => {
    setDragOverFileId(null);
  };

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

  const renderUploadStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3">
        {files.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
            <CardContent
              className={`p-12 text-center ${isDragOver ? 'bg-primary/5' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl text-muted-foreground">📄</div>
                <h3 className="text-xl font-semibold">Drag and drop PDF here</h3>
                <p className="text-muted-foreground">or</p>
                <Button 
                  onClick={() => document.getElementById('file-upload')?.click()}
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
                  ? "To change the order of your PDFs, drag and drop the file as you want."
                  : "Please select more PDF files"
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file, index) => (
                <Card 
                  key={file.id} 
                  className={`relative cursor-move transition-all ${
                    draggedFileId === file.id ? 'opacity-50 scale-95' : ''
                  } ${
                    dragOverFileId === file.id ? 'ring-2 ring-primary' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleFileDragStart(e, file.id)}
                  onDragOver={(e) => handleFileDragOver(e, file.id)}
                  onDragLeave={handleFileDragLeave}
                  onDrop={(e) => handleFileDrop(e, file.id)}
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
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          {file.preview}...
                        </div>
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
                onClick={mergePDFs}
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
            onClick={() => document.getElementById('file-upload')?.click()}
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
              <h3 className="text-xl font-semibold mb-2">Uploading file {files.length} of {files.length}</h3>
              <p className="text-muted-foreground">{processedFileName} ({(files.reduce((total, file) => total + parseFloat(file.size), 0)).toFixed(2)}mb)</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Time left 39 SECONDS • Upload speed 29kb/s</span>
              </div>
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
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-primary">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">PDFs have been merged!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Click on download button to download merged pdf or continue to work on the file with different tools displayed below.
          </p>

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
              onClick={downloadFile}
              className="bg-primary hover:bg-primary/90 h-12 px-8"
            >
              <Download className="h-4 w-4 mr-2" />
              Download to device
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

          <PDFToolRecommendations currentTool="merge" />
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
            onClick={() => currentStep === "upload" ? navigate("/pdf-tools") : setCurrentStep("upload")}
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

        {/* Hidden file input that's always available */}
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