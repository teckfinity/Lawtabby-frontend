import type { ReactNode } from "react";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";

export interface PDFToolDownloadResultProps {
  title: string;
  description: string;
  /** Main label for the output (download filename or summary). */
  outputFilename: string;
  /** e.g. original upload name(s), size line. */
  sourceSummary?: string;
  statusBanner?: ReactNode;
  /** Extra rows (e.g. multi-file convert list). */
  children?: ReactNode;
  /** Extra controls below the primary action row (Print, Convert more, etc.). */
  belowActions?: ReactNode;
  onDownload: () => void | Promise<void>;
  onReset: () => void;
  downloadButtonLabel?: string;
  currentTool: string;
}

/**
 * Shared “download / confirmation” step for PDF tools (merge, compress, protect, convert).
 * Keeps layout, colors, and actions consistent across the app.
 */
export function PDFToolDownloadResult({
  title,
  description,
  outputFilename,
  sourceSummary,
  statusBanner,
  children,
  belowActions,
  onDownload,
  onReset,
  downloadButtonLabel = "Download to device",
  currentTool,
}: PDFToolDownloadResultProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-primary">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{description}</p>

          <div className="bg-muted rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded flex items-center justify-center shrink-0">
                <span className="text-red-600 font-bold text-xs">PDF</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{outputFilename}</h4>
                <p className="text-sm text-muted-foreground truncate">
                  {sourceSummary ?? "Ready to download"}
                </p>
              </div>
            </div>
            {statusBanner ? <div className="mt-3">{statusBanner}</div> : null}
            {children}
          </div>

          <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
            <Button variant="outline" size="icon" onClick={onReset} className="h-12 w-12" aria-label="Start over">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button type="button" onClick={() => void onDownload()} className="bg-primary hover:bg-primary/90 h-12 px-8">
              <Download className="h-4 w-4 mr-2" />
              {downloadButtonLabel}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onReset}
              className="h-12 w-12 text-destructive hover:text-destructive"
              aria-label="Discard result and start over"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          {belowActions ? <div className="flex flex-wrap items-center justify-center gap-3 mb-2">{belowActions}</div> : null}

          <PDFToolRecommendations currentTool={currentTool} />
        </CardContent>
      </Card>
    </div>
  );
}
