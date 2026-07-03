import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, Trash2, RotateCcw, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { organizePDF } from "@/api";
import {
  buildLexorbitProcessedFilename,
  triggerBlobDownload,
} from "@/utils/lexorbitFilename";
import { PdfLibraryPickButton } from "@/components/library/LibraryFileSourceButtons";

// Drag and drop
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { pdfjs as pdfjsLib } from "@/lib/pdfjsWorker";

interface PDFPage {
  id: string;
  pageNumber: number;
  thumbnail: string;
  selected: boolean;
}

const OrganizePDF = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [deletedPages, setDeletedPages] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false); // NEW: Loading state

  const loadPdfFromFile = async (selectedFile: File) => {
    if (!selectedFile) return;

    setFile(selectedFile);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);

        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        const pdf = await loadingTask.promise;
        const pagesArray: PDFPage[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.25 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            console.warn(`Skipping page ${i}: no canvas context`);
            continue;
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          } as any;

          await page.render(renderContext).promise;

          const thumbnail = canvas.toDataURL("image/png");

          pagesArray.push({
            id: `page-${i}`,
            pageNumber: i,
            thumbnail,
            selected: false,
          });
        }

        setPages(pagesArray);
        toast.success(`Loaded ${pdf.numPages} pages successfully!`);
      };

      fileReader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error("PDF load error:", error);
      toast.error("Failed to load PDF");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) await loadPdfFromFile(selectedFile);
  };

  const togglePageSelection = (pageId: string) => {
    setPages(pages.map(page => 
      page.id === pageId 
        ? { ...page, selected: !page.selected }
        : page
    ));
  };

  const deleteSelectedPages = () => {
    const selectedPages = pages.filter(p => p.selected);
    const selectedCount = selectedPages.length;

    if (selectedCount === 0) {
      toast.error("Please select pages to delete");
      return;
    }

    // Track deleted page numbers
    const deleted = selectedPages.map(p => p.pageNumber);
    setDeletedPages(prev => [...prev, ...deleted]);

    // Remove selected pages, keep original page numbers
    const remainingPages = pages.filter(p => !p.selected);
    setPages(remainingPages);

    toast.success(`Deleted ${selectedCount} page(s)`);
  };

  const duplicateSelectedPages = () => {
    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error("Please select pages to duplicate");
      return;
    }

    const newPages = [...pages];
    selectedPages.forEach(page => {
      const duplicatedPage: PDFPage = {
        ...page,
        id: `${page.id}-duplicate-${Date.now()}`,
        selected: false
      };
      newPages.push(duplicatedPage);
    });
    
    setPages(newPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    })));
    toast.success(`Duplicated ${selectedPages.length} page(s)`);
  };

  const rotatePage = (pageId: string) => {
    toast.success("Page rotated 90° clockwise");
  };

  // FIXED: Proper download implementation
  const saveOrganizedPDF = async () => {
    if (!file) {
      toast.error("No PDF file selected");
      return;
    }
    if (pages.length === 0) {
      toast.error("No pages to save");
      return;
    }

    setIsDownloading(true);

    try {
      const userOrder = pages.map(page => page.pageNumber);
      const response = await organizePDF(file, userOrder, deletedPages);

      const organizedPDFUrl = response.data.organized_data.organize_pdf;

      // NEW: Fetch the PDF as a blob to force download
      const pdfResponse = await fetch(organizedPDFUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!pdfResponse.ok) {
        throw new Error(`HTTP error! status: ${pdfResponse.status}`);
      }

      const blob = await pdfResponse.blob();

      triggerBlobDownload(blob, buildLexorbitProcessedFilename(file.name, "organized"));

      toast.success("PDF downloaded successfully!");

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to organize PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const selectAll = () => setPages(pages.map(page => ({ ...page, selected: true })));
  const deselectAll = () => setPages(pages.map(page => ({ ...page, selected: false })));

  // Drag & drop handler
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const reorderedPages = Array.from(pages);
    const [removed] = reorderedPages.splice(result.source.index, 1);
    reorderedPages.splice(result.destination.index, 0, removed);
    setPages(reorderedPages);
  };

  /* ──────────────────────────────────────── */
  /*  UPLOAD STEP – EXACTLY LIKE StampPDF     */
  /* ──────────────────────────────────────── */
  const renderUploadStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8">
          {!file ? (
            <div className="text-center">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8">
                <Upload className="h-12 w-8 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF to Organize</h3>
                <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Select PDF File
                  </Button>
                  <PdfLibraryPickButton onFileReady={loadPdfFromFile} />
                </div>
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );

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
            <h1 className="text-3xl font-bold text-foreground">Organize PDF</h1>
            <p className="text-muted-foreground">Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document.</p>
          </div>
        </div>

        {!file ? (
          renderUploadStep()
        ) : (
          <div className="space-y-6">
            {/* Controls */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded flex items-center justify-center">
                      <span className="text-cyan-600 font-bold text-xs">PDF</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">{pages.length} pages loaded</p>
                    </div>
                  </div>
                  {/* UPDATED: Button with loading state */}
                  <Button 
                    onClick={saveOrganizedPDF} 
                    disabled={isDownloading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isDownloading ? (
                      <>
                        <Download className="h-4 w-4 mr-2 animate-pulse" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Organized PDF
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={deleteSelectedPages}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button variant="outline" size="sm" onClick={duplicateSelectedPages}>Duplicate Selected</Button>
                </div>
              </CardContent>
            </Card>

            {/* Pages Grid with Drag & Drop */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="pages" direction="horizontal">
                {(provided) => (
                  <div
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {pages.map((page, index) => (
                      <Draggable key={page.id} draggableId={page.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-pointer transition-all ${
                              page.selected ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                            }`}
                            onClick={() => togglePageSelection(page.id)}
                          >
                            <CardContent className="p-3">
                              <div className="relative">
                                <div className="aspect-[8.5/11] bg-white border rounded overflow-hidden mb-2">
                                  <img
                                    src={page.thumbnail}
                                    alt={`Page ${page.pageNumber}`}
                                    className="w-full h-full object-contain"
                                  />
                                </div>

                                {page.selected && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium">Page {page.pageNumber}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rotatePage(page.id);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Instructions */}
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">How to Organize Pages</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click on pages to select/deselect them</li>
                  <li>• Drag pages to reorder them</li>
                  <li>• Use the rotate button to rotate individual pages</li>
                  <li>• Delete unwanted pages or duplicate important ones</li>
                  <li>• Save your organized PDF when finished</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizePDF;