import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import PDFToolRecommendations from "@/components/PDFToolRecommendations";

const DownloadProtectedPDF = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    // Get the PDF data from navigation state
    const state = location.state as { pdfUrl?: string; fileName?: string };
    
    if (!state?.pdfUrl || !state?.fileName) {
      toast.error("No PDF file to download");
      navigate("/pdf/protect");
      return;
    }

    setPdfUrl(state.pdfUrl);
    setFileName(state.fileName);
  }, [location.state, navigate]);

  const handleDownload = () => {
    if (!pdfUrl || !fileName) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `protected_${fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  };

  const handleDelete = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    navigate("/pdf/protect");
    toast.success("File removed");
  };

  const resetProcess = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    navigate("/pdf/protect");
  };

  if (!pdfUrl) {
    return null;
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold text-foreground">Protect PDF</h1>
            <p className="text-muted-foreground">Your PDF has been protected successfully</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">PDFs have been protected!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Click on download button to download protected pdf or continue to work on the file with different tools displayed below.
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
                  onClick={handleDownload}
                  className="bg-primary hover:bg-primary/90 h-12 px-8"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download to device
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                  className="h-12 w-12 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              <PDFToolRecommendations currentTool="protect" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DownloadProtectedPDF;
