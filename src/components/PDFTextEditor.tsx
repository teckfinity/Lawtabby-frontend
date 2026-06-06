import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Save,
  X,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  countModifiedBlocks,
  extractPdfEditorPages,
  savePdfTextEdits,
  type PdfEditorPage,
  type PdfTextBlock,
} from "@/utils/pdfTextEditor";

interface PDFTextEditorProps {
  file: File;
  onSave: (newFile: File) => void;
  onCancel: () => void;
}

const PDFTextEditor = ({ file, onSave, onCancel }: PDFTextEditorProps) => {
  const [pages, setPages] = useState<PdfEditorPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [scale, setScale] = useState(1);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  const loadPages = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setPages([]);
    setActiveBlockId(null);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

      const extracted = await extractPdfEditorPages(file);
      if (!extracted.length) {
        throw new Error("This PDF has no pages.");
      }
      setPages(extracted);
    } catch (error) {
      console.error("PDF text editor load failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load PDF for editing.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const updateBlockText = (blockId: string, text: string) => {
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        blocks: page.blocks.map((block) =>
          block.id === blockId ? { ...block, text } : block,
        ),
      })),
    );
  };

  const handleSave = async () => {
    const modified = countModifiedBlocks(pages);
    if (modified === 0) {
      toast.message("No text changes to save.");
      onCancel();
      return;
    }

    setIsSaving(true);
    try {
      const pdfBytes = await savePdfTextEdits(file, pages);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const newFile = new File([blob], file.name, { type: "application/pdf" });
      onSave(newFile);
    } catch (error) {
      console.error("PDF text editor save failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save PDF. Try a smaller file or fewer edits.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const totalBlocks = pages.reduce((n, p) => n + p.blocks.length, 0);
  const modifiedBlocks = countModifiedBlocks(pages);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[min(70vh,640px)] bg-muted/40 rounded-lg border">
        <div className="text-center space-y-3 px-6">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
          <p className="font-medium">Preparing editable PDF…</p>
          <p className="text-sm text-muted-foreground">
            Detecting text regions and preserving page layout.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-[min(70vh,640px)] bg-muted/40 rounded-lg border gap-4 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <p className="font-medium">Could not open PDF for editing</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{loadError}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          <Button onClick={loadPages}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[min(70vh,640px)] bg-card rounded-lg border overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 border-b sticky top-0 z-20">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Click any highlighted text to edit. Changes are saved as real PDF text.
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.min(1.6, +(s + 0.1).toFixed(2)))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {totalBlocks === 0 && (
        <div className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <strong>No editable text detected.</strong> This PDF may be a scan or image-only
          file. Use the <strong>OCR</strong> tool first to add a text layer, or use{" "}
          <strong>Add Text</strong> to place new text on top.
        </div>
      )}

      <div className="flex-1 overflow-auto bg-muted/30 p-6">
        <div ref={pagesContainerRef} className="flex flex-col items-center gap-8">
          {pages.map((page) => (
            <div key={page.pageIndex} className="relative">
              <div
                className="relative bg-white shadow-lg ring-1 ring-border/60"
                style={{
                  width: page.displayWidth * scale,
                  height: page.displayHeight * scale,
                }}
              >
                <img
                  src={page.backgroundUrl}
                  alt={`Page ${page.pageIndex + 1}`}
                  className="absolute inset-0 w-full h-full pointer-events-none select-none"
                  draggable={false}
                />

                <div
                  className="absolute inset-0"
                  style={{
                    width: page.displayWidth,
                    height: page.displayHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  {page.blocks.map((block) => (
                    <EditableTextBlock
                      key={block.id}
                      block={block}
                      isActive={activeBlockId === block.id}
                      onFocus={() => setActiveBlockId(block.id)}
                      onBlur={() => setActiveBlockId((id) => (id === block.id ? null : id))}
                      onChange={(text) => updateBlockText(block.id, text)}
                    />
                  ))}
                </div>

                <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-white pointer-events-none z-10">
                  Page {page.pageIndex + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 border-t bg-muted/40 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        <span>{pages.length} page{pages.length === 1 ? "" : "s"}</span>
        <span>{totalBlocks} editable region{totalBlocks === 1 ? "" : "s"}</span>
        <span>{modifiedBlocks} modified</span>
      </div>
    </div>
  );
};

function EditableTextBlock({
  block,
  isActive,
  onFocus,
  onBlur,
  onChange,
}: {
  block: PdfTextBlock;
  isActive: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isModified = block.text.trim() !== block.originalText.trim();

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    if (el.textContent !== block.text) {
      el.textContent = block.text;
    }
  }, [block.text]);

  return (
    <div
      ref={ref}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      title="Click to edit this text"
      className={`absolute outline-none cursor-text rounded-sm px-0.5 transition-shadow ${
        isActive
          ? "ring-2 ring-primary bg-white/95 shadow-sm z-20"
          : isModified
            ? "bg-amber-100/90 hover:ring-1 hover:ring-amber-400 z-10"
            : "bg-white/85 hover:ring-1 hover:ring-primary/40 z-10"
      }`}
      style={{
        left: block.displayX,
        top: block.displayY,
        minWidth: Math.max(block.displayWidth, 24),
        minHeight: block.displayHeight,
        fontSize: block.fontSize,
        fontFamily:
          block.fontFamily.startsWith("Times")
            ? '"Times New Roman", Times, serif'
            : block.fontFamily.startsWith("Courier")
              ? '"Courier New", Courier, monospace'
              : "Helvetica, Arial, sans-serif",
        fontWeight: block.fontWeight,
        fontStyle: block.fontStyle,
        lineHeight: 1.15,
        color: "#111",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
      onFocus={onFocus}
      onBlur={(e) => {
        onChange(e.currentTarget.textContent ?? "");
        onBlur();
      }}
      onInput={(e) => onChange(e.currentTarget.textContent ?? "")}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).blur();
        }
      }}
    />
  );
}

export default PDFTextEditor;
