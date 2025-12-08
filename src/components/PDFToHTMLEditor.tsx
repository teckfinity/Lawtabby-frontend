import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Save,
  X,
  Type,
  Highlighter,
  List,
  ListOrdered,
} from "lucide-react";

interface PDFToHTMLEditorProps {
  file: File;
  onSave: (newFile: File) => void;
  onCancel: () => void;
}

interface PageData {
  pageNum: number;
  width: number;
  height: number;
  content: string;
  backgroundImage: string;
}

const PDFToHTMLEditor = ({ file, onSave, onCancel }: PDFToHTMLEditorProps) => {
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState("16");
  const [selectedFont, setSelectedFont] = useState("Arial");
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  // Extract PDF content WITH FULL FORMATTING
  const extractPDFContent = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      
      const extractedPages: PageData[] = [];
      
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        
        // Render page to canvas for background
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        const backgroundImage = canvas.toDataURL("image/png");
        
        // Extract text content WITH positioning and styling
        const textContent = await page.getTextContent();
        let htmlContent = '<div style="position: relative; width: 100%; height: 100%;">';
        
        // Process each text item with its exact position and style
        textContent.items.forEach((item: any) => {
          if (item.str && item.str.trim()) {
            const transform = item.transform;
            const x = transform[4];
            const y = viewport.height - transform[5]; // Flip Y coordinate
            
            // Calculate font size from transform matrix
            const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
            
            // Get font information
            const fontName = item.fontName || "";
            let fontFamily = "Arial";
            let fontWeight = "normal";
            let fontStyle = "normal";
            
            // Detect font family
            if (fontName.toLowerCase().includes("times")) {
              fontFamily = "Times New Roman, serif";
            } else if (fontName.toLowerCase().includes("courier")) {
              fontFamily = "Courier New, monospace";
            } else if (fontName.toLowerCase().includes("helvetica") || fontName.toLowerCase().includes("arial")) {
              fontFamily = "Arial, sans-serif";
            }
            
            // Detect bold
            if (fontName.toLowerCase().includes("bold")) {
              fontWeight = "bold";
            }
            
            // Detect italic
            if (fontName.toLowerCase().includes("italic") || fontName.toLowerCase().includes("oblique")) {
              fontStyle = "italic";
            }
            
            // Calculate text width for better positioning
            const textWidth = item.width || fontSize * item.str.length * 0.5;
            
            // Create positioned text element
            htmlContent += `
              <span style="
                position: absolute;
                left: ${x}px;
                top: ${y - fontSize}px;
                font-size: ${fontSize}px;
                font-family: ${fontFamily};
                font-weight: ${fontWeight};
                font-style: ${fontStyle};
                white-space: pre;
                cursor: text;
              " contenteditable="true" class="pdf-text-item">${item.str}</span>
            `;
          }
        });
        
        htmlContent += '</div>';
        
        if (!textContent.items.length) {
          htmlContent = `<div style="padding: 40px;"><p contenteditable="true" style="font-size: 16px; margin-bottom: 15px;">Click here to start editing...</p></div>`;
        }
        
        extractedPages.push({
          pageNum,
          backgroundImage,
          width: viewport.width / 2,
          height: viewport.height / 2,
          content: htmlContent,
        });
      }
      
      setPages(extractedPages);
      setIsLoading(false);
    } catch (error) {
      console.error("Error extracting PDF:", error);
      setIsLoading(false);
    }
  }, [file]);

  useEffect(() => {
    extractPDFContent();
  }, [extractPDFContent]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const handleFontSizeChange = (size: string) => {
    setSelectedFontSize(size);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      try {
        range.surroundContents(span);
      } catch (e) {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
    }
  };

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    execCommand("fontName", font);
  };

  const updatePageContent = (pageNum: number, content: string) => {
    setPages((prev) =>
      prev.map((page) =>
        page.pageNum === pageNum ? { ...page, content } : page
      )
    );
  };

  // Convert edited HTML back to PDF
  const saveAsPDF = async () => {
    if (!pagesContainerRef.current) return;

    setIsSaving(true);

    try {
      const [{ PDFDocument }, html2canvas] = await Promise.all([
        import("pdf-lib"),
        import("html2canvas").then(m => m.default)
      ]);
      
      const pdfDoc = await PDFDocument.create();
      const pageElements = pagesContainerRef.current.querySelectorAll(".pdf-page");

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i] as HTMLElement;
        
        // Capture with high quality to preserve formatting
        const canvas = await html2canvas(pageEl, {
          scale: 3, // Higher scale for better quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 0,
          removeContainer: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgBytes = await fetch(imgData).then((res) => res.arrayBuffer());
        const pdfImage = await pdfDoc.embedPng(imgBytes);

        const page = pages[i];
        const pdfPage = pdfDoc.addPage([page.width, page.height]);

        pdfPage.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: page.width,
          height: page.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const newFile = new File([blob], file.name, { type: "application/pdf" });

      onSave(newFile);
    } catch (error) {
      console.error("Error saving PDF:", error);
      alert("Failed to save PDF. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600">Converting PDF to editable format...</p>
          <p className="text-sm text-gray-500">Preserving original formatting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-100 border-b sticky top-0 z-10">
        <select
          value={selectedFont}
          onChange={(e) => handleFontChange(e.target.value)}
          className="h-8 px-2 text-sm border rounded bg-white"
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>

        <select
          value={selectedFontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="h-8 px-2 text-sm border rounded bg-white w-16"
        >
          <option value="10">10</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
          <option value="24">24</option>
          <option value="28">28</option>
          <option value="32">32</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("underline")}
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="relative">
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
            onChange={(e) => execCommand("foreColor", e.target.value)}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Type className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
            onChange={(e) => execCommand("hiliteColor", e.target.value)}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Highlighter className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("justifyLeft")}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("justifyCenter")}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("justifyRight")}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("justifyFull")}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("insertUnorderedList")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("insertOrderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("undo")}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("redo")}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setScale((s) => Math.min(2, s + 0.1))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={saveAsPDF}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? "Saving..." : "Save as PDF"}
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        <div ref={pagesContainerRef} className="flex flex-col items-center gap-8">
          {pages.map((page) => (
            <div
              key={page.pageNum}
              className="pdf-page relative bg-white shadow-xl"
              style={{
                width: page.width * scale,
                height: page.height * scale,
                minHeight: page.height * scale,
                backgroundImage: `url(${page.backgroundImage})`,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Editable overlay with preserved formatting */}
              <div
                className="absolute inset-0 focus:outline-none overflow-hidden"
                style={{
                  cursor: "text",
                  transform: `scale(${scale / 2})`,
                  transformOrigin: "top left",
                  width: `${(100 / scale) * 2}%`,
                  height: `${(100 / scale) * 2}%`,
                }}
                dangerouslySetInnerHTML={{ __html: page.content }}
                onInput={(e) =>
                  updatePageContent(page.pageNum, e.currentTarget.innerHTML)
                }
              />

              {/* Page number */}
              <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-80 px-3 py-1 rounded text-xs text-white pointer-events-none z-10">
                Page {page.pageNum}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-100 border-t text-xs text-gray-600 flex items-center justify-between">
        <span>
          Original formatting preserved. Click any text to edit. Use toolbar for additional formatting.
        </span>
        <span className="text-gray-500">
          {pages.length} page{pages.length > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

export default PDFToHTMLEditor;