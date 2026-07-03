import { useMemo } from "react";
import { File, FolderOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLibraryDocuments } from "@/api/hooks/useDocumentLibrary";
import type { LibraryDocument } from "@/api/ai-features/document-library";

type LibraryPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (document: LibraryDocument) => void;
  /** Restrict to file types usable by the target feature (e.g. pdf, docx, txt). */
  compatibleTypes?: string[];
  title?: string;
  description?: string;
};

export function LibraryPickerDialog({
  open,
  onOpenChange,
  onSelect,
  compatibleTypes,
  title = "Pick from Library",
  description = "Choose a document you already uploaded to your library.",
}: LibraryPickerDialogProps) {
  const { data, isLoading, isError } = useLibraryDocuments({
    category: "uploaded",
  });

  const documents = useMemo(() => {
    const results = data?.results ?? [];
    if (!compatibleTypes?.length) return results;
    const allowed = new Set(compatibleTypes.map((t) => t.toLowerCase()));
    return results.filter((doc) => allowed.has(doc.file_type.toLowerCase()));
  }, [data?.results, compatibleTypes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-legal-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading your library…
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-destructive text-sm">
            Could not load library files. Please try again.
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No compatible files in your library yet.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/library/uploaded">Go to Document Library</Link>
            </Button>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  onSelect(doc);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/60 transition-colors"
              >
                <div className="w-10 h-12 bg-muted rounded flex items-center justify-center shrink-0">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{doc.original_filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.size_display} · {doc.date_display}
                  </p>
                </div>
                <Badge variant="secondary" className="uppercase text-[10px]">
                  {doc.file_type}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
