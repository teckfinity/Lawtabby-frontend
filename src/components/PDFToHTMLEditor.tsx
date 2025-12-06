import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Save,
  X,
  Type,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas";

interface PDFToHTMLEditorProps {
  file: File;
  onSave: (newFile: File) => void;
  onCancel: () => void;
}

interface PageData {
  pageNum: number;
  backgroundImage: string;
  width: number;
  height: number;
  textItems: TextItem[];
}

interface TextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  transform: string;
}

const PDFToHTMLEditor = ({ file, onSave, onCancel }: PDFToHTMLEditorProps) => {
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  // Extract PDF content with positioning
  const extractPDFContent = useCallback(async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      
      const extractedPages: PageData[] = [];
      
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 }); // Higher scale for quality
        
        // Render page to canvas for background
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        // @ts-expect-error - react-pdf types mismatch with pdfjs
        await page.render(renderContext).promise;
        
        const backgroundImage = canvas.toDataURL("image/png");
        
        // Extract text with positioning
        const textContent = await page.getTextContent();
        const textItems: TextItem[] = [];
        
        for (const item of textContent.items) {
          if ("str" in item && item.str.trim()) {
            const transform = item.transform;
            const x = transform[4];
            const y = viewport.height / 2 - transform[5]; // Convert to top-down coords
            const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
            const fontName = item.fontName || "sans-serif";
            
            // Determine font weight from font name
            const fontWeight = fontName.toLowerCase().includes("bold") ? "bold" : "normal";
            
            textItems.push({
              id: `text-${pageNum}-${textItems.length}`,
              text: item.str,
              x: x,
              y: y,
              width: item.width || fontSize * item.str.length * 0.6,
              height: fontSize * 1.2,
              fontSize: fontSize,
              fontFamily: fontName.includes("Times") ? "Times New Roman" : 
                         fontName.includes("Courier") ? "Courier New" : "Arial",
              fontWeight: fontWeight,
              color: "#000000",
              transform: `matrix(${transform[0]}, ${transform[1]}, ${transform[2]}, ${transform[3]}, 0, 0)`,
            });
          }
        }
        
        extractedPages.push({
          pageNum,
          backgroundImage,
          width: viewport.width / 2, // Adjust for display scale
          height: viewport.height / 2,
          textItems,
        });
      }
      
      setPages(extractedPages);
      setIsLoading(false);
      toast.success(`Converted ${extractedPages.length} page(s) to editable format`);
      
    } catch (error) {
      console.error("Error extracting PDF:", error);
      toast.error("Failed to convert PDF");
      setIsLoading(false);
    }
  }, [file]);

  useEffect(() => {
    extractPDFContent();
  }, [extractPDFContent]);

  // Execute formatting command
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Save edited content back to PDF
  const saveAsPDF = async () => {
    if (!pagesContainerRef.current) return;
    
    setIsSaving(true);
    toast.loading("Converting to PDF...", { id: "save-pdf" });
    
    try {
      const pdfDoc = await PDFDocument.create();
      const pageElements = pagesContainerRef.current.querySelectorAll(".pdf-page");
      
      for (const pageEl of pageElements) {
        const htmlElement = pageEl as HTMLElement;
        
        // Capture the page as canvas
        const canvas = await html2canvas(htmlElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        
        // Convert to image and add to PDF
        const imgData = canvas.toDataURL("image/png");
        const imgBytes = await fetch(imgData).then((res) => res.arrayBuffer());
        const pdfImage = await pdfDoc.embedPng(imgBytes);
        
        // Get original page dimensions
        const pageWidth = parseFloat(htmlElement.dataset.width || "612");
        const pageHeight = parseFloat(htmlElement.dataset.height || "792");
        
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Draw image to fill page
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const newFile = new File([blob], file.name, { type: "application/pdf" });
      
      onSave(newFile);
      toast.success("PDF saved successfully!", { id: "save-pdf" });
      
    } catch (error) {
      console.error("Error saving PDF:", error);
      toast.error("Failed to save PDF", { id: "save-pdf" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-muted/30 rounded-lg">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Converting PDF to editable format...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={editorRef} className="flex flex-col h-full bg-background rounded-lg border shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 border-b sticky top-0 z-10">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("bold")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("italic")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("underline")}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("justifyLeft")}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("justifyCenter")}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("justifyRight")}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-1">
          <div className="relative">
            <input
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
              onChange={(e) => execCommand("foreColor", e.target.value)}
              title="Text Color"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Type className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("undo")}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("redo")}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={saveAsPDF} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save as PDF"}
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-muted/30 p-8">
        <div ref={pagesContainerRef} className="flex flex-col items-center gap-8">
          {pages.map((page) => (
            <div
              key={page.pageNum}
              className="pdf-page relative bg-white shadow-xl"
              data-width={page.width}
              data-height={page.height}
              style={{
                width: page.width * scale,
                height: page.height * scale,
                backgroundImage: `url(${page.backgroundImage})`,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Editable overlay - entire page is contentEditable */}
              <div
                contentEditable
                suppressContentEditableWarning
                className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={{
                  fontSize: `${12 * scale}px`,
                  lineHeight: 1.5,
                  cursor: "text",
                }}
              />
              
              {/* Page number indicator */}
              <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs text-muted-foreground">
                Page {page.pageNum}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground">
        Click anywhere on the page to edit text. Use the toolbar for formatting. Changes will be saved to PDF.
      </div>
    </div>
  );
};

export default PDFToHTMLEditor;
