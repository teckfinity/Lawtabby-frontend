import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, Download, Trash2, RotateCcw, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Simulate PDF page extraction
      const samplePages: PDFPage[] = Array.from({ length: 8 }, (_, i) => ({
        id: `page-${i + 1}`,
        pageNumber: i + 1,
        thumbnail: `Page ${i + 1} content preview`,
        selected: false
      }));
      setPages(samplePages);
      toast.success("PDF loaded successfully");
    }
  };

  const togglePageSelection = (pageId: string) => {
    setPages(pages.map(page => 
      page.id === pageId 
        ? { ...page, selected: !page.selected }
        : page
    ));
  };

  const deleteSelectedPages = () => {
    const selectedCount = pages.filter(p => p.selected).length;
    if (selectedCount === 0) {
      toast.error("Please select pages to delete");
      return;
    }
    
    const remainingPages = pages.filter(p => !p.selected);
    setPages(remainingPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    })));
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
    // In a real implementation, this would rotate the actual page
    toast.success("Page rotated 90° clockwise");
  };

  const saveOrganizedPDF = () => {
    if (pages.length === 0) {
      toast.error("No pages to save");
      return;
    }
    toast.success("Organized PDF saved successfully!");
  };

  const selectAll = () => {
    setPages(pages.map(page => ({ ...page, selected: true })));
  };

  const deselectAll = () => {
    setPages(pages.map(page => ({ ...page, selected: false })));
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
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
          /* Upload Area */
          <Card className="h-96">
            <CardContent className="p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload PDF to Organize</h3>
                <p className="text-muted-foreground mb-4">Choose a PDF file from your device</p>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select PDF File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </CardContent>
          </Card>
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
                  <Button onClick={saveOrganizedPDF} className="bg-primary hover:bg-primary/90">
                    <Download className="h-4 w-4 mr-2" />
                    Save Organized PDF
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={deleteSelectedPages}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button variant="outline" size="sm" onClick={duplicateSelectedPages}>
                    Duplicate Selected
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pages Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pages.map((page) => (
                <Card 
                  key={page.id}
                  className={`cursor-pointer transition-all ${
                    page.selected 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover:shadow-md"
                  }`}
                  onClick={() => togglePageSelection(page.id)}
                >
                  <CardContent className="p-3">
                    <div className="relative">
                      {/* Page Thumbnail */}
                      <div className="aspect-[8.5/11] bg-white border rounded flex items-center justify-center text-center text-xs text-gray-600 mb-2">
                        <div>
                          <div className="font-bold mb-1">Page {page.pageNumber}</div>
                          <div className="text-xs opacity-60">{page.thumbnail}</div>
                        </div>
                      </div>
                      
                      {/* Selection Indicator */}
                      {page.selected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      
                      {/* Drag Handle */}
                      <div className="absolute top-1 left-1 cursor-grab">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
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
              ))}
            </div>

            {/* Instructions */}
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">How to Organize Pages</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click on pages to select/deselect them</li>
                  <li>• Drag pages to reorder them (feature not implemented in demo)</li>
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