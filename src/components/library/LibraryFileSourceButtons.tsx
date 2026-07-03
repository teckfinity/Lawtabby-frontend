import { useRef, useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LibraryPickerDialog } from "@/components/library/LibraryPickerDialog";
import { libraryDocumentToFile } from "@/api/ai-features/document-library";
import type { LibraryDocument } from "@/api/ai-features/document-library";

type LibraryFileSourceButtonsProps = {
  accept: string;
  compatibleTypes?: string[];
  onFileReady: (file: File) => void;
  disabled?: boolean;
  chooseLabel?: string;
  pickLabel?: string;
  layout?: "row" | "column";
  chooseClassName?: string;
};

export function LibraryFileSourceButtons({
  accept,
  compatibleTypes = ["pdf", "docx", "txt"],
  onFileReady,
  disabled = false,
  chooseLabel = "Choose File",
  pickLabel = "Pick from Library",
  layout = "row",
  chooseClassName,
}: LibraryFileSourceButtonsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLibrarySelect = async (doc: LibraryDocument) => {
    setLoading(true);
    try {
      const file = await libraryDocumentToFile(doc.id, doc.original_filename);
      onFileReady(file);
      toast.success(`Using ${doc.original_filename}`);
    } catch {
      toast.error("Could not load file from library.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={
          layout === "row"
            ? "flex flex-col sm:flex-row items-center justify-center gap-3"
            : "flex flex-col items-stretch gap-2 w-full"
        }
      >
        <Button
          type="button"
          className={chooseClassName}
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
        >
          {chooseLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || loading}
          onClick={() => setPickerOpen(true)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FolderOpen className="h-4 w-4 mr-2" />
          )}
          {pickLabel}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) {
            onFileReady(selected);
            e.target.value = "";
          }
        }}
      />

      <LibraryPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        compatibleTypes={compatibleTypes}
        onSelect={handleLibrarySelect}
      />
    </>
  );
}

/** Compact pick-only control for PDF tool dropzones */
export function PdfLibraryPickButton({
  onFileReady,
  disabled,
  className,
}: {
  onFileReady: (file: File) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (doc: LibraryDocument) => {
    if (doc.file_type.toLowerCase() !== "pdf") {
      toast.error("Please pick a PDF from your library.");
      return;
    }
    setLoading(true);
    try {
      const file = await libraryDocumentToFile(doc.id, doc.original_filename);
      onFileReady(file);
      toast.success(`Added ${doc.original_filename}`);
    } catch {
      toast.error("Could not load PDF from library.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={disabled || loading}
        onClick={() => setPickerOpen(true)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FolderOpen className="h-4 w-4 mr-2" />
        )}
        Pick from Library
      </Button>
      <LibraryPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        compatibleTypes={["pdf"]}
        description="Choose a PDF you already saved in your library."
        onSelect={handleSelect}
      />
    </>
  );
}
