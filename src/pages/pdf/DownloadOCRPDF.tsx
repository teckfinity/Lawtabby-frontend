import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Trash2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";

const DownloadOCRPDF = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pdfUrl, fileName } = location.state || {};

  const handleDownload = () => {
    if (!pdfUrl) {
      toast.error("No OCR PDF available for download");
      return;
    }

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = fileName || "ocr_processed.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("OCR PDF downloaded successfully!");
  };

  const handleDelete = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    navigate("/pdf/ocr");
  };

  const resetProcess = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    navigate("/pdf/ocr");
  };

  if (!pdfUrl) {
    return (
      <div className="w-full p-4 md:p-6 lg:p-8 bg-background min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No OCR PDF available</p>
            <Button onClick={() => navigate("/pdf/ocr")}>
              Go back to OCR
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetProcess}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                OCR Another PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl font-bold">PDFs have been processed with OCR!</h2>
              <p className="text-muted-foreground">
                Your document is now searchable and selectable
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <Button
                onClick={handleDownload}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="h-5 w-5 mr-2" />
                Download to device
              </Button>
            </div>

            <PDFToolRecommendations currentTool="ocr" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DownloadOCRPDF;
